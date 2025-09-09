export type CanonicalRole = 'admin' | 'psicologo' | 'usuario';

function stripAccents(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Convierte enum/string/objeto/id a 'admin' | 'psicologo' | 'usuario' */
export function normalizeRole(input: any): CanonicalRole {
  if (input == null) return 'usuario';

  let raw: any = input;
  if (typeof raw === 'object') raw = raw.name ?? raw.role ?? raw.roleId ?? raw.code ?? raw.slug ?? raw.title ?? '';
  const asStr = String(raw).trim();

  if (/^\d+$/.test(asStr)) {
    if (asStr === '1') return 'admin';
    if (asStr === '2') return 'psicologo';
    return 'usuario';
  }

  let s = stripAccents(asStr.toLowerCase()).replace(/\s+/g, ' ');
  if (['admin','administrator','administrador'].includes(s)) return 'admin';
  if (['psicologo','psicologa','psychologist','terapeuta','terapista','profesional'].includes(s)) return 'psicologo';
  if (['usuario','user','cliente','paciente'].includes(s)) return 'usuario';

  return 'usuario';
}
