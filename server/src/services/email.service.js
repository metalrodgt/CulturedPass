import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { escaparHtml as h } from '../utils/html.js';
import { fechaLegible } from '../utils/fechas.js';

// Si no hay credenciales SMTP, los correos se muestran en la consola (modo desarrollo).
const transporter =
  env.SMTP_USER && env.SMTP_PASS
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      })
    : null;

if (!transporter) {
  console.warn('⚠️  SMTP no configurado: los correos se mostrarán en consola y NO se enviarán.');
}

const unaLinea = (s) => String(s).replace(/[\r\n]+/g, ' ');

// Nunca lanza error: un fallo de correo no debe romper una inscripción ya guardada.
const enviarSeguro = async ({ para, asunto, html, texto }) => {
  try {
    if (!transporter) {
      console.log(`\n📧 [CORREO SIMULADO] Para: ${para}\nAsunto: ${asunto}\n${texto}\n`);
      return;
    }
    await transporter.sendMail({ from: env.MAIL_FROM, to: para, subject: asunto, html, text: texto });
  } catch (err) {
    console.error(`❌ No se pudo enviar el correo a ${para}:`, err.message);
  }
};

const fila = (etiqueta, valor) =>
  `<tr><td style="padding:6px 12px;color:#666">${etiqueta}</td><td style="padding:6px 12px"><strong>${h(valor)}</strong></td></tr>`;

// Ticket simulado con los datos del evento y el código identificador único
export const enviarBoletoPorCorreo = ({ evento, boleto }) => {
  const fecha = fechaLegible(evento.fecha_evento);
  const horario = evento.fecha_final
    ? `${evento.hora_inicio} hasta las ${evento.hora_finalizacion} del ${fechaLegible(evento.fecha_final)}`
    : `${evento.hora_inicio} a ${evento.hora_finalizacion}`;
  const html = `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto">
    <h2>🎟️ Tu inscripción fue confirmada</h2>
    <p>Hola <strong>${h(boleto.nombre)}</strong>, ya tienes lugar en:</p>
    <table style="border-collapse:collapse;background:#f7f7f7;border-radius:8px">
      ${fila('Evento', evento.nombre_evento)}
      ${fila('Fecha', fecha)}
      ${fila('Horario', horario)}
      ${fila('Lugar', evento.ubicacion)}
    </table>
    <p style="margin-top:20px">Tu código de boleto:</p>
    <p style="font-size:30px;letter-spacing:6px;font-weight:bold;background:#222;color:#fff;padding:12px;text-align:center;border-radius:8px">${h(boleto.codigo)}</p>
    <p>Preséntalo el día del evento. También lo necesitarás si quieres cancelar tu inscripción.</p>
  </div>`;
  const texto = `Inscripción confirmada\nEvento: ${evento.nombre_evento}\nFecha: ${fecha}\nHorario: ${horario}\nLugar: ${evento.ubicacion}\nTu código: ${boleto.codigo}`;
  return enviarSeguro({
    para: boleto.gmail,
    asunto: unaLinea(`Tu boleto para ${evento.nombre_evento}`),
    html,
    texto,
  });
};

// Aviso a todos los inscriptos cuando el organizador edita el evento
export const notificarCambiosEvento = async ({ nombreEvento, cambios, destinatarios }) => {
  const lineasHtml = cambios
    .map((c) => `<li>Del evento <strong>${h(nombreEvento)}</strong>, se cambió <strong>${h(c.campo)}</strong>: pasó de “${h(c.anterior)}” a <strong>“${h(c.nuevo)}”</strong></li>`)
    .join('');
  const lineasTexto = cambios
    .map((c) => `- Del evento ${nombreEvento}, se cambió ${c.campo}: pasó de "${c.anterior}" a "${c.nuevo}"`)
    .join('\n');

  for (const d of destinatarios) {
    // Secuencial a propósito: evita ráfagas que el proveedor SMTP podría bloquear
    // eslint-disable-next-line no-await-in-loop
    await enviarSeguro({
      para: d.gmail,
      asunto: unaLinea(`Cambios en el evento ${nombreEvento}`),
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto"><h2>Se actualizó un evento al que estás inscripto</h2><p>Hola ${h(d.nombre)},</p><ul>${lineasHtml}</ul><p>Tu boleto sigue siendo válido.</p></div>`,
      texto: `Hola ${d.nombre},\n${lineasTexto}\nTu boleto sigue siendo válido.`,
    });
  }
};

const textoRol = (rol) => (rol === 'organizador' ? 'organizador' : 'visitante');

// Se envía cuando una cuenta (organizador o visitante) es autorizada
export const enviarCuentaAutorizada = ({ cuenta, rol }) =>
  enviarSeguro({
    para: cuenta.gmail,
    asunto: 'Tu cuenta de CulturedPass fue autorizada',
    html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto"><h2>Tu cuenta fue autorizada</h2><p>Hola <strong>${h(cuenta.nombre)}</strong>, tu cuenta de ${textoRol(rol)} ya fue autorizada.</p><p>Ya puedes iniciar sesión con el correo <strong>${h(cuenta.gmail)}</strong> y la contraseña que elegiste al registrarte.</p></div>`,
    texto: `Hola ${cuenta.nombre}, tu cuenta de ${textoRol(rol)} ya fue autorizada. Ya puedes iniciar sesión con el correo ${cuenta.gmail} y la contraseña que elegiste al registrarte.`,
  });

// Se envía cuando otra persona (administrador u organizador) modifica los datos de una cuenta.
// Por seguridad NUNCA se envía la contraseña por correo: solo se avisa si fue cambiada.
export const enviarDatosActualizados = async ({ anterior, nueva, contrasenaCambiada }) => {
  const destinos = new Set([nueva.gmail]);
  if (anterior.gmail !== nueva.gmail) destinos.add(anterior.gmail); // también al correo viejo, como aviso
  const filaDato = (etiqueta, valor) => fila(etiqueta, valor);
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto">
    <h2>Se actualizaron los datos de tu cuenta</h2>
    <p>Hola <strong>${h(nueva.nombre)}</strong>, estos son los datos actuales de tu cuenta de CulturedPass:</p>
    <table style="border-collapse:collapse;background:#f7f7f7;border-radius:8px">
      ${filaDato('Nombre', nueva.nombre)}
      ${filaDato('Correo (para iniciar sesión)', nueva.gmail)}
      ${filaDato('DNI', nueva.dni)}
      ${filaDato('Teléfono', nueva.numero_tel)}
    </table>
    <p>${contrasenaCambiada ? 'Tu contraseña fue modificada. Pídesela a la persona que hizo el cambio: por seguridad no se envía por correo.' : 'Tu contraseña no fue modificada.'}</p>
    <p>Debes iniciar sesión nuevamente con estos datos.</p></div>`;
  const texto = `Se actualizaron los datos de tu cuenta.\nNombre: ${nueva.nombre}\nCorreo: ${nueva.gmail}\nDNI: ${nueva.dni}\nTeléfono: ${nueva.numero_tel}\n${contrasenaCambiada ? 'Tu contraseña fue modificada (pídesela a quien hizo el cambio).' : 'Tu contraseña no fue modificada.'}\nDebes iniciar sesión nuevamente.`;
  for (const para of destinos) {
    // eslint-disable-next-line no-await-in-loop
    await enviarSeguro({ para, asunto: 'Se actualizaron los datos de tu cuenta de CulturedPass', html, texto });
  }
};
