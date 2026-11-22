// Prueba las REGLAS DE VALIDACIÓN de los datos que se ingresan, sin base de datos ni servidor.
// Uso (en la carpeta server/):   node scripts/probarValidaciones.js
// Cada caso dice qué se espera; al final se muestra cuántos pasaron.

// schemas.js importa configuración que exige variables de entorno: si no están, se usan valores de prueba
process.env.DATABASE_URL ||= 'postgresql://prueba:prueba@localhost:5432/prueba';
process.env.JWT_SECRET ||= 'x'.repeat(40);

const { registroSchema, loginSchema, editarCuentaSchema, eventoSchema, cancelacionSchema, clavesSchema } =
  await import('../src/validators/schemas.js');

let pasaron = 0;
let fallaron = 0;

// esperado: { valido: true|false, campos?: { campo: valorEsperadoDespuesDeNormalizar }, errorEn?: 'campo' }
const probar = (titulo, schema, entrada, esperado) => {
  const r = schema.safeParse(entrada);
  let ok = r.success === esperado.valido;
  let detalle = '';

  if (ok && r.success && esperado.campos) {
    for (const [campo, valor] of Object.entries(esperado.campos)) {
      if (r.data[campo] !== valor) {
        ok = false;
        detalle = `   · "${campo}" quedó como ${JSON.stringify(r.data[campo])} y se esperaba ${JSON.stringify(valor)}`;
      }
    }
  }
  if (ok && !r.success && esperado.errorEn) {
    const campos = r.error.issues.map((i) => i.path.join('.'));
    if (!campos.includes(esperado.errorEn)) {
      ok = false;
      detalle = `   · el error debía estar en "${esperado.errorEn}" pero está en ${JSON.stringify(campos)}`;
    }
  }
  if (!ok && !detalle) {
    detalle = r.success
      ? '   · se ACEPTÓ y se esperaba que se rechazara'
      : `   · se RECHAZÓ (${r.error.issues[0].message}) y se esperaba que se aceptara`;
  }

  if (ok) pasaron += 1;
  else fallaron += 1;
  console.log(`${ok ? '✅' : '❌'} ${titulo}${detalle ? `\n${detalle}` : ''}`);
};

const titulo = (t) => console.log(`\n=== ${t} ===`);

// ---------------- Crear cuenta ----------------
titulo('Crear cuenta');
const cuenta = { nombre: 'Juan Pérez', gmail: 'juan@gmail.com', dni: '12345678', numero_tel: '3625195393', contrasena: 'contraseña1234' };

probar('Datos correctos, sin clave (cuenta de visitante)', registroSchema, cuenta, { valido: true });
probar('Con clave escrita', registroSchema, { ...cuenta, clave: 'CulturedPass7774' }, { valido: true });
probar('Gmail en MAYÚSCULAS se guarda en minúsculas', registroSchema, { ...cuenta, gmail: 'JUAN@GMAIL.COM' }, { valido: true, campos: { gmail: 'juan@gmail.com' } });
probar('Gmail con espacios al inicio y al final se recorta', registroSchema, { ...cuenta, gmail: '  juan@gmail.com  ' }, { valido: true, campos: { gmail: 'juan@gmail.com' } });
probar('Gmail con un espacio en el medio se rechaza', registroSchema, { ...cuenta, gmail: 'ju an@gmail.com' }, { valido: false, errorEn: 'gmail' });
probar('Gmail sin arroba se rechaza', registroSchema, { ...cuenta, gmail: 'juangmail.com' }, { valido: false, errorEn: 'gmail' });
probar('Gmail sin punto en el dominio se rechaza', registroSchema, { ...cuenta, gmail: 'juan@gmail' }, { valido: false, errorEn: 'gmail' });
probar('Nombre con espacios repetidos se junta en uno', registroSchema, { ...cuenta, nombre: '  Juan     Pérez  ' }, { valido: true, campos: { nombre: 'Juan Pérez' } });
probar('Nombre solo con espacios se rechaza', registroSchema, { ...cuenta, nombre: '     ' }, { valido: false, errorEn: 'nombre' });
probar('Nombre con < > (código HTML) se rechaza', registroSchema, { ...cuenta, nombre: '<script>alert(1)</script>' }, { valido: false, errorEn: 'nombre' });
probar('Nombre con apóstrofe y acentos es válido', registroSchema, { ...cuenta, nombre: "María O'Brien Ñandú" }, { valido: true });
probar('Nombre de más de 100 caracteres se rechaza', registroSchema, { ...cuenta, nombre: 'a'.repeat(101) }, { valido: false, errorEn: 'nombre' });

titulo('DNI');
probar('DNI de 8 números', registroSchema, cuenta, { valido: true });
probar('DNI de 7 números', registroSchema, { ...cuenta, dni: '1234567' }, { valido: true });
probar('DNI con espacios alrededor se recorta', registroSchema, { ...cuenta, dni: ' 12345678 ' }, { valido: true, campos: { dni: '12345678' } });
probar('DNI con puntos se rechaza', registroSchema, { ...cuenta, dni: '12.345.678' }, { valido: false, errorEn: 'dni' });
probar('DNI de 6 números se rechaza', registroSchema, { ...cuenta, dni: '123456' }, { valido: false, errorEn: 'dni' });
probar('DNI de 9 números se rechaza', registroSchema, { ...cuenta, dni: '123456789' }, { valido: false, errorEn: 'dni' });
probar('DNI con letras se rechaza', registroSchema, { ...cuenta, dni: '1234567a' }, { valido: false, errorEn: 'dni' });
probar('DNI que empieza con 0 se rechaza (evita duplicar "1234567" con "01234567")', registroSchema, { ...cuenta, dni: '01234567' }, { valido: false, errorEn: 'dni' });

titulo('Teléfono');
probar('Teléfono solo números', registroSchema, cuenta, { valido: true });
probar('Teléfono con +, espacios y guiones', registroSchema, { ...cuenta, numero_tel: '+54 362 419-5393' }, { valido: true });
probar('Teléfono con paréntesis', registroSchema, { ...cuenta, numero_tel: '(0362) 4195393' }, { valido: true });
probar('Teléfono de 5 números se rechaza', registroSchema, { ...cuenta, numero_tel: '12345' }, { valido: false, errorEn: 'numero_tel' });
probar('Teléfono "------" (sin números) se rechaza', registroSchema, { ...cuenta, numero_tel: '------' }, { valido: false, errorEn: 'numero_tel' });
probar('Teléfono "((((((" se rechaza', registroSchema, { ...cuenta, numero_tel: '((((((' }, { valido: false, errorEn: 'numero_tel' });
probar('Teléfono con letras se rechaza', registroSchema, { ...cuenta, numero_tel: '362abc5393' }, { valido: false, errorEn: 'numero_tel' });
probar('Teléfono de más de 20 caracteres se rechaza', registroSchema, { ...cuenta, numero_tel: '3'.repeat(21) }, { valido: false, errorEn: 'numero_tel' });

titulo('Contraseña (distingue mayúsculas y NO recorta espacios)');
probar('Contraseña de 8 caracteres', registroSchema, { ...cuenta, contrasena: '12345678' }, { valido: true });
probar('Contraseña de 7 caracteres se rechaza', registroSchema, { ...cuenta, contrasena: '1234567' }, { valido: false, errorEn: 'contrasena' });
probar('Contraseña con espacios al inicio se conserva tal cual', registroSchema, { ...cuenta, contrasena: '  abcdefgh' }, { valido: true, campos: { contrasena: '  abcdefgh' } });
probar('Contraseña con MAYÚSCULAS se conserva (no se pasa a minúsculas)', registroSchema, { ...cuenta, contrasena: 'ClaveSegura1' }, { valido: true, campos: { contrasena: 'ClaveSegura1' } });
probar('Contraseña de 72 caracteres', registroSchema, { ...cuenta, contrasena: 'a'.repeat(72) }, { valido: true });
probar('Contraseña de 73 caracteres se rechaza', registroSchema, { ...cuenta, contrasena: 'a'.repeat(73) }, { valido: false, errorEn: 'contrasena' });
probar('Contraseña de 30 emojis (60 caracteres pero 120 bytes: bcrypt solo usa 72 bytes) se rechaza', registroSchema, { ...cuenta, contrasena: '😀'.repeat(30) }, { valido: false, errorEn: 'contrasena' });

titulo('Campos obligatorios al crear cuenta');
for (const campo of ['nombre', 'gmail', 'dni', 'numero_tel', 'contrasena']) {
  const sin = { ...cuenta };
  delete sin[campo];
  probar(`Falta "${campo}" se rechaza`, registroSchema, sin, { valido: false, errorEn: campo });
}

// ---------------- Iniciar sesión ----------------
titulo('Iniciar sesión');
probar('Gmail en MAYÚSCULAS inicia sesión igual (se pasa a minúsculas)', loginSchema, { gmail: 'JUAN@Gmail.COM', contrasena: 'x' }, { valido: true, campos: { gmail: 'juan@gmail.com' } });
probar('Gmail con espacios alrededor se recorta', loginSchema, { gmail: ' juan@gmail.com ', contrasena: 'x' }, { valido: true, campos: { gmail: 'juan@gmail.com' } });
probar('Contraseña vacía se rechaza', loginSchema, { gmail: 'juan@gmail.com', contrasena: '' }, { valido: false, errorEn: 'contrasena' });

// ---------------- Editar cuenta ----------------
titulo('Editar cuenta / Mi cuenta');
const edicion = { nombre: 'Juan Pérez', gmail: 'juan@gmail.com', dni: '12345678', numero_tel: '3625195393' };
probar('Sin contraseña nueva (se deja la actual)', editarCuentaSchema, edicion, { valido: true });
probar('Contraseña vacía "" (se deja la actual)', editarCuentaSchema, { ...edicion, contrasena: '' }, { valido: true });
probar('Contraseña nueva de 8 caracteres', editarCuentaSchema, { ...edicion, contrasena: 'nuevaClave1' }, { valido: true });
probar('Contraseña nueva de 5 caracteres se rechaza', editarCuentaSchema, { ...edicion, contrasena: '12345' }, { valido: false, errorEn: 'contrasena' });

// ---------------- Crear / editar evento ----------------
titulo('Crear / editar evento');
const evento = {
  nombre_evento: 'Concierto de Otoño',
  nombre_encargado: 'Ana Gómez',
  numero_telefono: '3625195393',
  fecha_evento: '2027-05-10',
  ubicacion: 'UNNE, salón de eventos',
  hora_inicio: '15:00',
  hora_finalizacion: '17:00',
  portada: 'https://ejemplo.com/portada.jpg',
  cupo_total: 20,
  descripcion: 'Una orquesta.\nSegunda línea.',
};
probar('Evento correcto', eventoSchema, evento, { valido: true });
probar('Nombre del evento con espacios repetidos se junta', eventoSchema, { ...evento, nombre_evento: '  Concierto    de   Otoño ' }, { valido: true, campos: { nombre_evento: 'Concierto de Otoño' } });
probar('Descripción con varias líneas es válida', eventoSchema, evento, { valido: true, campos: { descripcion: 'Una orquesta.\nSegunda línea.' } });
probar('Descripción con < > se rechaza', eventoSchema, { ...evento, descripcion: 'hola <b>x</b>' }, { valido: false, errorEn: 'descripcion' });
probar('Nombre del evento con salto de línea se rechaza', eventoSchema, { ...evento, nombre_evento: 'Linea1\nLinea2' }, { valido: false, errorEn: 'nombre_evento' });
probar('Hora de fin menor a la de inicio SIN fecha final se rechaza', eventoSchema, { ...evento, hora_inicio: '22:00', hora_finalizacion: '02:00' }, { valido: false, errorEn: 'hora_finalizacion' });
probar('Hora de fin igual a la de inicio SIN fecha final se rechaza', eventoSchema, { ...evento, hora_inicio: '15:00', hora_finalizacion: '15:00' }, { valido: false, errorEn: 'hora_finalizacion' });
probar('Hora de fin menor CON fecha final (día siguiente) es válida', eventoSchema, { ...evento, hora_inicio: '22:00', hora_finalizacion: '02:00', fecha_final: '2027-05-11' }, { valido: true });
probar('Fecha final de dos días después se rechaza', eventoSchema, { ...evento, fecha_final: '2027-05-12' }, { valido: false, errorEn: 'fecha_final' });
probar('Fecha final igual a la del evento se rechaza', eventoSchema, { ...evento, fecha_final: '2027-05-10' }, { valido: false, errorEn: 'fecha_final' });
probar('Fecha final vacía "" equivale a sin fecha final', eventoSchema, { ...evento, fecha_final: '' }, { valido: true, campos: { fecha_final: null } });
probar('Fecha inexistente (31 de febrero) se rechaza', eventoSchema, { ...evento, fecha_evento: '2027-02-31' }, { valido: false, errorEn: 'fecha_evento' });
probar('Hora inválida (25:00) se rechaza', eventoSchema, { ...evento, hora_inicio: '25:00' }, { valido: false, errorEn: 'hora_inicio' });
probar('Cupo 0 se rechaza', eventoSchema, { ...evento, cupo_total: 0 }, { valido: false, errorEn: 'cupo_total' });
probar('Cupo negativo se rechaza', eventoSchema, { ...evento, cupo_total: -5 }, { valido: false, errorEn: 'cupo_total' });
probar('Cupo con decimales se rechaza', eventoSchema, { ...evento, cupo_total: 1.5 }, { valido: false, errorEn: 'cupo_total' });
probar('Cupo escrito como texto "25" se acepta como número', eventoSchema, { ...evento, cupo_total: '25' }, { valido: true, campos: { cupo_total: 25 } });
probar('Cupo mayor a 100000 se rechaza', eventoSchema, { ...evento, cupo_total: 100001 }, { valido: false, errorEn: 'cupo_total' });
probar('Portada sin http(s) se rechaza', eventoSchema, { ...evento, portada: 'portada.jpg' }, { valido: false, errorEn: 'portada' });
probar('Portada "javascript:" se rechaza', eventoSchema, { ...evento, portada: 'javascript:alert(1)' }, { valido: false, errorEn: 'portada' });
probar('Portada con espacios adentro se rechaza', eventoSchema, { ...evento, portada: 'https://ejemplo.com/mi portada.jpg' }, { valido: false, errorEn: 'portada' });
probar('Teléfono del encargado con letras se rechaza', eventoSchema, { ...evento, numero_telefono: 'abc' }, { valido: false, errorEn: 'numero_telefono' });

// ---------------- Cancelar inscripción y clave ----------------
titulo('Código de boleto y clave de registro');
probar('Código en minúsculas se pasa a MAYÚSCULAS', cancelacionSchema, { codigo: 'abcd2345' }, { valido: true, campos: { codigo: 'ABCD2345' } });
probar('Código con espacios alrededor se recorta', cancelacionSchema, { codigo: '  abcd2345 ' }, { valido: true, campos: { codigo: 'ABCD2345' } });
probar('Nueva clave de organizador válida (se respetan las mayúsculas)', clavesSchema, { clave_organizador: 'CulturedPass7774' }, { valido: true, campos: { clave_organizador: 'CulturedPass7774' } });
probar('Nueva clave de 5 caracteres se rechaza', clavesSchema, { clave_organizador: 'abc12' }, { valido: false, errorEn: 'clave_organizador' });
probar('Nueva clave con espacios en el medio se rechaza', clavesSchema, { clave_organizador: 'Mi clave 123' }, { valido: false, errorEn: 'clave_organizador' });

console.log(`\n=== Resultado: ${pasaron} pasaron, ${fallaron} fallaron ===`);
process.exit(fallaron === 0 ? 0 : 1);
