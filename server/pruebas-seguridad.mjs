const API = 'http://localhost:3000/api';
const post = (ruta, cuerpo) =>
  fetch(API + ruta, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
const probar = async (titulo, promesa) => {
  const r = await promesa;
  console.log(`\n${titulo}\n  → HTTP ${r.status}  ${(await r.text()).slice(0, 150)}`);
};

console.log('===== SQL INJECTION =====');
await probar('Login con payload clásico (correo inválido)',
  post('/auth/login', { gmail: "' OR '1'='1", contrasena: 'x' }));            // esperado: 400
await probar('Login con correo de formato válido + payload en contraseña',
  post('/auth/login', { gmail: "admin'--@x.com", contrasena: "' OR '1'='1" })); // esperado: 401
await probar('Id con inyección en la URL',
  fetch(API + '/eventos/1%20OR%201=1'));                                       // esperado: 400 "Id inválido"
await probar('Inscripción con DROP TABLE en el nombre (se guarda como texto literal)',
  post('/eventos/1/inscripciones', { nombre: "Robert'); DROP TABLE boleto;--", gmail: 'sqli@test.com' })); // esperado: 201

console.log('\n===== XSS =====');
await probar('Script en el nombre',
  post('/eventos/1/inscripciones', { nombre: '<script>alert(1)</script>', gmail: 'xss1@test.com' })); // esperado: 400
await probar('Imagen con onerror',
  post('/eventos/1/inscripciones', { nombre: '<img src=x onerror=alert(1)>', gmail: 'xss2@test.com' })); // esperado: 400