import { Body, Controller, Get, Headers, Post, Query, Req, Res } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ApiTags } from '@nestjs/swagger';
import { createReadStream } from 'fs';
import { join } from 'path';
import type { Response, Request } from 'express';
import { Public } from '../auth/public.decorator';  // 👈

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Post('checkout')
  @Public()  // 👈 ya no pedirá JWT
  async checkout(@Body() body: { ebookId: number }, @Req() _req: Request) {
    return this.service.createCheckout(Number(body.ebookId));
  }

  @Post('webhook')
  @Public()
  async webhook(@Headers('stripe-signature') sig: string, @Req() req: Request) {
    const raw = (req as any).rawBody || Buffer.from(JSON.stringify((req as any).body ?? {}));
    return this.service.handleWebhook(sig, raw);
  }

  @Get('status')
  @Public()
  async status(@Query('session_id') sessionId: string) {
    return this.service.getBySession(sessionId);
  }

  @Get('download')
  @Public()
  async download(@Query('token') token: string, @Res() res: Response) {
    const { ebook } = await this.service.getDownloadInfo(token);
    if (ebook.fileUrl?.startsWith('http')) {
      res.redirect(ebook.fileUrl); return;
    }
    const rel = (ebook.fileUrl || (ebook as any)['filePath'] || '').replace(/^\//, '');
    const filePath = join(process.cwd(), rel);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${(ebook.title || 'ebook').replace(/[^\w\.-]/g, '_')}.pdf"`);
    createReadStream(filePath).pipe(res);
  }
}
