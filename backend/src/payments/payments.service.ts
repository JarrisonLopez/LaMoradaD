// LaMorada/backend/src/payments/payments.service.ts
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'stripe';
import { Repository } from 'typeorm';
import { Purchase } from '../entities/purchase.entity';
import { Ebook } from '../entities/ebook.entity';
import { randomBytes } from 'crypto';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;
  private log = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Purchase) private readonly purchases: Repository<Purchase>,
    @InjectRepository(Ebook) private readonly ebooks: Repository<Ebook>,
  ) {
    // Leer y depurar la clave desde .env
    const raw = process.env.STRIPE_SECRET ?? '';
    const key = raw.trim();

    // Logs de diagnóstico (puedes quitar luego)
    const hex = Array.from(raw).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
    this.log.log(`[PAY] CWD: ${process.cwd()}`);
    this.log.log(`[PAY] STRIPE raw len: ${raw.length}, key len: ${key.length}`);
    this.log.log(`[PAY] STRIPE prefix: ${key.slice(0, 12)}, suffix: ${key.slice(-6)}`);
    this.log.log(`[PAY] STRIPE hex: ${hex}`);

    if (!key) throw new Error('Falta STRIPE_SECRET en .env');
    if (!key.startsWith('sk_')) throw new Error(`STRIPE_SECRET no válido: ${key.slice(0, 8)}...`);

    // Inicializar Stripe (sin apiVersion para evitar el error de tipos)
    this.stripe = new Stripe(key);
  }

  // Normaliza precios COP que pueden venir como number o string con separadores
  private normalizeCopMajor(value: unknown): number {
    if (value == null) return 0;
    if (typeof value === 'number') return Math.round(value);

    let s = String(value).trim();
    if (!s) return 0;
    s = s.replace(/\s+/g, '');

    if (s.includes('.') && s.includes(',')) {
      // "100.000,00" o "100,000.00" -> quitar no dígitos y quedarnos con enteros
      s = s.replace(/[^\d]/g, '');
      return Math.round(Number(s));
    }

    if (s.includes('.')) {
      if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
        // miles con punto: "100.000" -> 100000
        s = s.replace(/\./g, '');
        return Math.round(Number(s));
      }
      if (/^\d+\.\d+$/.test(s)) {
        // decimal real: "100.50" -> 100 (COP sin decimales)
        return Math.floor(Number(s));
      }
      s = s.replace(/\./g, '');
      return Math.round(Number(s));
    }

    if (s.includes(',')) {
      if (/^\d{1,3}(,\d{3})+$/.test(s)) {
        // miles con coma: "100,000" -> 100000
        s = s.replace(/,/g, '');
        return Math.round(Number(s));
      }
      if (/^\d+,\d+$/.test(s)) {
        // decimal real: "100,50" -> 100
        return Math.floor(Number(s.split(',')[0]));
      }
      s = s.replace(/,/g, '');
      return Math.round(Number(s));
    }

    return Math.round(Number(s));
  }

  /** Inicia un Checkout (Stripe pedirá email en su UI) */
  async createCheckout(ebookId: number) {
    const ebook = await this.ebooks.findOne({ where: { id: ebookId } });
    if (!ebook) throw new BadRequestException('Ebook no encontrado');

    const currency = 'COP';
    const MIN_COP = 2500; // ~ USD $0.50

    // Precio “major units” (pesos), por ej. "100.000" -> 100000
    const rawPrice = (ebook as any).price;
    const priceCop = this.normalizeCopMajor(rawPrice);

    this.log.log(`[PAY] checkout → ebookId=${ebookId} "${ebook.title}" raw="${rawPrice}" priceCop=${priceCop} ${currency}`);

    if (!priceCop || priceCop <= 0) {
      throw new BadRequestException('Ebook sin precio válido');
    }
    if (priceCop < MIN_COP) {
      throw new BadRequestException(`El monto mínimo es ${MIN_COP} ${currency}. Ajusta el precio del e-book.`);
    }

    // COP en Stripe usa minor units (centavos) → multiplicar por 100
    const unitAmountMinor = Math.round(priceCop * 100);
    this.log.log(`[PAY] sending to Stripe → unit_amount=${unitAmountMinor} (minor units) ${currency}`);

    // Registro preliminar
    const purchase = await this.purchases.save(
      this.purchases.create({ ebook, buyerEmail: '', status: 'PENDING' }),
    );

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${process.env.PUBLIC_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.PUBLIC_URL}/checkout/cancel`,
      line_items: [
        {
          price_data: {
            currency: 'cop', // minúsculas
            product_data: {
              name: ebook.title,
              description: ebook.description?.slice(0, 200) ?? undefined,
            },
            unit_amount: unitAmountMinor,
          },
          quantity: 1,
        },
      ],
      metadata: {
        ebookId: String(ebook.id),
        purchaseId: String(purchase.id),
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    purchase.stripeSessionId = session.id;
    await this.purchases.save(purchase);
    return { url: session.url!, purchaseId: purchase.id };
  }

  /**
   * NUEVO FLUJO SIMPLE (sin webhook):
   * En la página /checkout/success, el front manda session_id aquí.
   * Nosotros consultamos Stripe y, si está pagado, marcamos la compra como PAID
   * y emitimos el token de descarga.
   */
  async getBySession(sessionId: string) {
    // 1) Recuperar la Session desde Stripe
    const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'customer'],
    });

    // 2) Buscar la purchase por sessionId o por metadata.purchaseId
    let purchase = await this.purchases.findOne({
      where: { stripeSessionId: sessionId },
      relations: ['ebook'],
    });

    if (!purchase && session.metadata?.purchaseId) {
      const id = Number(session.metadata.purchaseId);
      if (!Number.isNaN(id)) {
        purchase = await this.purchases.findOne({ where: { id }, relations: ['ebook'] });
      }
    }

    if (!purchase) throw new BadRequestException('Compra no encontrada');

    // 3) ¿Está pagada?
    const isPaid =
      session.payment_status === 'paid' ||
      (session.status === 'complete' && session.mode === 'payment');

    // 4) Si está pagada y aún no marcamos, finalizar
    if (isPaid && purchase.status !== 'PAID') {
      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id;

      const emailFromStripe =
        session.customer_details?.email || session.customer_email || '';

      // token de descarga (24h)
      const token = randomBytes(24).toString('hex');
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      purchase.status = 'PAID';
      purchase.stripePaymentIntentId = paymentIntentId ?? null;
      purchase.downloadToken = token;
      purchase.downloadTokenExpiresAt = expires;

      if (emailFromStripe && !purchase.buyerEmail) {
        purchase.buyerEmail = emailFromStripe;
      }

      await this.purchases.save(purchase);
    }

    // 5) Devolver el estado actual (el front hará poll hasta ver PAID)
    return purchase;
  }

  /** (Opcional) Webhook: puedes dejarlo por compatibilidad, pero ya no es necesario usarlo */
  async handleWebhook(sig: string | string[] | undefined, rawBody: Buffer) {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!endpointSecret) {
      // Si no configuraste webhook, no hacemos nada
      this.log.warn('[PAY] Webhook llamado pero no hay STRIPE_WEBHOOK_SECRET configurado.');
      return { ok: true };
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, sig as string, endpointSecret);
    } catch (err: any) {
      this.log.error('Webhook signature verification failed', err?.message);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const purchaseId = Number(session.metadata?.purchaseId);

      let purchase = await this.purchases.findOne({ where: { id: purchaseId }, relations: ['ebook'] });
      if (!purchase) return { ok: true };

      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id;

      const emailFromStripe =
        session.customer_details?.email || session.customer_email || '';

      // token de descarga (24h)
      const token = randomBytes(24).toString('hex');
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      purchase.status = 'PAID';
      purchase.stripePaymentIntentId = paymentIntentId ?? null;
      purchase.downloadToken = token;
      purchase.downloadTokenExpiresAt = expires;

      if (emailFromStripe && !purchase.buyerEmail) {
        purchase.buyerEmail = emailFromStripe;
      }

      await this.purchases.save(purchase);
    }

    return { ok: true };
  }

  /** Validar token y devolver info para descarga */
  async getDownloadInfo(token: string) {
    const purchase = await this.purchases.findOne({
      where: { downloadToken: token, status: 'PAID' },
      relations: ['ebook'],
    });
    if (!purchase) throw new BadRequestException('Token inválido');
    if (!purchase.downloadTokenExpiresAt || purchase.downloadTokenExpiresAt < new Date()) {
      throw new BadRequestException('Token expirado');
    }
    return { ebook: purchase.ebook };
  }
}
