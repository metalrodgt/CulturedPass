import { z } from 'zod';

const SIN_HTML_UNA_LINEA = /^[^<>\r\n]*$/;
const SIN_HTML = /^[^<>]*$/;

// Texto obligatorio, recortado, con largo máximo y SIN los caracteres < > (anti inyección HTML)
const texto = (etiqueta, max, { multilinea = false } = {}) =>
  z
    .string({ required_error: `${etiqueta} es obligatorio`, invalid_type_error: `${etiqueta} debe ser texto` })
    .trim()
    .min(1, `${etiqueta} es obligatorio`)
    .max(max, `${etiqueta} no puede superar los ${max} caracteres`)
    .regex(multilinea ? SIN_HTML : SIN_HTML_UNA_LINEA, `${etiqueta} contiene caracteres no permitidos`);

const gmail = z
  .string({ required_error: 'El correo es obligatorio' })
  .trim()
  .toLowerCase()
  .max(254, 'El correo es demasiado largo')
  .regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'El correo no es válido');

const telefono = z
  .string({ required_error: 'El teléfono es obligatorio' })
  .trim()
  .regex(/^[0-9+() -]{6,20}$/, 'El teléfono no es válido (6 a 20 caracteres: números, + ( ) -)');

const contrasena = z
  .string({ required_error: 'La contraseña es obligatoria' })
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña no puede superar los 72 caracteres');

const hora = z
  .string({ required_error: 'La hora es obligatoria' })
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora inválida (formato HH:MM)');

const fecha = z
  .string({ required_error: 'La fecha es obligatoria' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (formato AAAA-MM-DD)')
  .refine((s) => {
    const d = new Date(`${s}T00:00:00.000Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, 'La fecha no existe');

const portada = z
  .string({ required_error: 'La portada es obligatoria' })
  .trim()
  .max(500, 'La URL de la portada es demasiado larga')
  .regex(/^https?:\/\/\S+$/i, 'La portada debe ser una URL http(s)')
  .regex(SIN_HTML, 'La portada contiene caracteres no permitidos');

// ----- Auth -----
export const registroSchema = z.object({
  nombre: texto('El nombre', 100),
  gmail,
  numero_tel: telefono,
  contrasena,
});

export const loginSchema = z.object({
  gmail,
  contrasena: z.string({ required_error: 'La contraseña es obligatoria' }).min(1).max(72),
});

// ----- Eventos -----
export const eventoSchema = z
  .object({
    nombre_evento: texto('El nombre del evento', 150),
    nombre_encargado: texto('El nombre del encargado', 100),
    numero_telefono: telefono,
    fecha_evento: fecha,
    ubicacion: texto('La ubicación', 200),
    hora_inicio: hora,
    hora_finalizacion: hora,
    portada,
    cupo_total: z.coerce
      .number({ invalid_type_error: 'El cupo debe ser un número' })
      .int('El cupo debe ser un número entero')
      .min(1, 'El cupo total debe ser mayor a 0')
      .max(100000, 'El cupo total es demasiado grande'),
    descripcion: texto('La descripción', 5000, { multilinea: true }),
  })
  // Regla 11
  .refine((d) => d.hora_finalizacion > d.hora_inicio, {
    message: 'La hora de finalización debe ser posterior a la hora de inicio',
    path: ['hora_finalizacion'],
  });

// ----- Boletos -----
export const inscripcionSchema = z.object({
  nombre: texto('El nombre', 100),
  gmail,
});

export const cancelacionSchema = z.object({
  codigo: z
    .string({ required_error: 'El código es obligatorio' })
    .trim()
    .toUpperCase()
    .min(1, 'El código es obligatorio')
    .max(50),
});

export const asistenciaSchema = z.object({
  estado: z.enum(['Presente', 'Ausente'], { errorMap: () => ({ message: 'Estado inválido' }) }),
});

export const filtroBoletosSchema = z.object({
  estado: z.enum(['Presente', 'Ausente']).optional(),
  q: z.string().trim().max(100).optional(),
});

// ----- Organizadores -----
export const editarOrganizadorSchema = z.object({
  nombre: texto('El nombre', 100),
  gmail,
  numero_tel: telefono,
  // Opcional: si viene vacío o ausente, no se cambia la contraseña
  contrasena: contrasena.optional().or(z.literal('')),
});

export const aprobacionSchema = z.object({
  aprobacion: z.boolean({ required_error: 'aprobacion es obligatorio', invalid_type_error: 'aprobacion debe ser true o false' }),
});

export const idSchema = z.object({
  id: z.coerce.number().int().positive('Id inválido'),
});
