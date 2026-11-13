// MODELO · utilidades de formato de datos

// '2026-11-17' -> '17/11/2026'
export const fechaLegible = (iso) => (iso ? iso.split('-').reverse().join('/') : '');

// '2026-11-08T14:30:00.000Z' -> '08/11/2026'
export const fechaDeTimestamp = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

// Fecha de hoy en formato AAAA-MM-DD según el reloj del dispositivo
export const hoyISO = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

// Minúsculas y sin tildes, para buscar sin importar acentos
export const normalizar = (texto) =>
  String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

// 125 -> '2:05'
export const minutosSegundos = (total) =>
  `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;

// Copia al portapapeles (con alternativa para conexiones http no seguras, como al probar en el celular)
export const copiarTexto = async (texto) => {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = texto;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }
};

// '2026-11-17' -> '2026-11-18' (devuelve '' si la fecha no es válida)
export const sumarDia = (iso) => {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return '';
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};
