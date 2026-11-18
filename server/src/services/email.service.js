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

// Se envía cuando un administrador modifica los datos de otra cuenta.
// Lleva los datos actuales y, si el administrador cambió la contraseña, la contraseña nueva
// (la que él escribió). La contraseña guardada nunca se puede leer: está cifrada con bcrypt.
export const enviarDatosActualizados = async ({ anterior, nueva, contrasenaNueva }) => {
  const armar = (conContrasena) => {
    const filas = [
      fila('Nombre', nueva.nombre),
      fila('Correo (para iniciar sesión)', nueva.gmail),
      fila('DNI', nueva.dni),
      fila('Teléfono', nueva.numero_tel),
      conContrasena && contrasenaNueva ? fila('Contraseña', contrasenaNueva) : '',
    ].join('');
    const nota = contrasenaNueva
      ? conContrasena
        ? 'Esta es tu nueva contraseña. Te recomendamos cambiarla desde "Mi cuenta" cuando inicies sesión.'
        : 'Tu contraseña también fue modificada.'
      : 'Tu contraseña no fue modificada. Si la olvidaste, usa "¿Olvidaste tu contraseña?" en el inicio de sesión.';
    const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto">
      <h2>Se actualizaron los datos de tu cuenta</h2>
      <p>Hola <strong>${h(nueva.nombre)}</strong>, un administrador modificó tu cuenta de CulturedPass. Estos son tus datos actuales:</p>
      <table style="border-collapse:collapse;background:#f7f7f7;border-radius:8px">${filas}</table>
      <p>${h(nota)}</p><p>Debes iniciar sesión nuevamente con estos datos.</p></div>`;
    const texto = `Se actualizaron los datos de tu cuenta.\nNombre: ${nueva.nombre}\nCorreo: ${nueva.gmail}\nDNI: ${nueva.dni}\nTeléfono: ${nueva.numero_tel}${conContrasena && contrasenaNueva ? `\nContraseña: ${contrasenaNueva}` : ''}\n${nota}\nDebes iniciar sesión nuevamente.`;
    return { html, texto };
  };

  // Al correo actual se le envían los datos (con la contraseña nueva si hubo);
  // si cambió el correo, al viejo solo se le avisa (sin contraseña).
  const principal = armar(true);
  await enviarSeguro({ para: nueva.gmail, asunto: 'Se actualizaron los datos de tu cuenta de CulturedPass', ...principal });
  if (anterior.gmail !== nueva.gmail) {
    const aviso = armar(false);
    await enviarSeguro({ para: anterior.gmail, asunto: 'Se actualizaron los datos de tu cuenta de CulturedPass', ...aviso });
  }
};

// Enlace para cambiar la contraseña (vale 1 hora y se puede usar una sola vez)
export const enviarRecuperacion = ({ cuenta, enlace }) =>
  enviarSeguro({
    para: cuenta.gmail,
    asunto: 'Cambia tu contraseña de CulturedPass',
    html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto"><h2>Cambiar contraseña</h2><p>Hola <strong>${h(cuenta.nombre)}</strong>, recibimos un pedido para cambiar la contraseña de tu cuenta.</p><p><a href="${h(enlace)}" style="display:inline-block;background:#5e120a;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">Cambiar mi contraseña</a></p><p>Si el botón no funciona, copia este enlace en tu navegador:<br>${h(enlace)}</p><p>El enlace vence en 1 hora y solo se puede usar una vez. Si no lo pediste tú, ignora este correo: tu contraseña no cambia.</p></div>`,
    texto: `Hola ${cuenta.nombre}, para cambiar tu contraseña ingresa a este enlace (vence en 1 hora y se usa una sola vez):\n${enlace}\nSi no lo pediste tú, ignora este correo.`,
  });
