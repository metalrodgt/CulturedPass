import { prisma } from '../config/prisma.js';
import { AppError } from './AppError.js';

// Forma unificada de "usuario con sesión" (organizador o visitante)
export const aUsuario = (rol, c) =>
  rol === 'organizador'
    ? {
        rol,
        id_organizador: c.id_organizador,
        nombre: c.nombre,
        gmail: c.gmail,
        dni: c.dni,
        numero_tel: c.numero_tel,
        administrador: c.administrador,
      }
    : {
        rol,
        id_visitante: c.id_visitante,
        nombre: c.nombre,
        gmail: c.gmail,
        dni: c.dni,
        numero_tel: c.numero_tel,
        administrador: false,
      };

export const idDe = (u) => (u.rol === 'organizador' ? u.id_organizador : u.id_visitante);

// Busca una cuenta por correo en ambas tablas. Devuelve { rol, cuenta } o null.
export const buscarPorGmail = async (gmail) => {
  const org = await prisma.organizador.findUnique({ where: { gmail } });
  if (org) return { rol: 'organizador', cuenta: org };
  const vis = await prisma.visitante.findUnique({ where: { gmail } });
  if (vis) return { rol: 'visitante', cuenta: vis };
  return null;
};

// El correo y el DNI deben ser únicos entre organizadores Y visitantes.
// "excluir" = la cuenta que se está editando ({ rol, id }) para no chocar consigo misma.
export const verificarDisponibilidad = async ({ gmail, dni }, excluir = null) => {
  const [orgs, viss] = await Promise.all([
    prisma.organizador.findMany({
      where: { OR: [{ gmail }, { dni }] },
      select: { id_organizador: true, gmail: true, dni: true },
    }),
    prisma.visitante.findMany({
      where: { OR: [{ gmail }, { dni }] },
      select: { id_visitante: true, gmail: true, dni: true },
    }),
  ]);
  const otros = [
    ...orgs.filter((o) => !(excluir?.rol === 'organizador' && excluir.id === o.id_organizador)),
    ...viss.filter((v) => !(excluir?.rol === 'visitante' && excluir.id === v.id_visitante)),
  ];
  if (otros.some((c) => c.gmail === gmail)) throw new AppError(409, 'Ya existe una cuenta con ese correo');
  if (otros.some((c) => c.dni === dni)) throw new AppError(409, 'Ya existe una cuenta con ese DNI');
};

// Actualiza una cuenta y copia sus datos nuevos a los boletos que ya emitió
// (así la lista de asistencia y "Mis boletos" siempre muestran datos actuales).
export const actualizarCuenta = (rol, id, data) =>
  prisma.$transaction(async (tx) => {
    const esOrg = rol === 'organizador';
    const modelo = esOrg ? tx.organizador : tx.visitante;
    const where = esOrg ? { id_organizador: id } : { id_visitante: id };
    const antes = await modelo.findUnique({ where });
    const actualizada = await modelo.update({ where, data });
    await tx.boleto.updateMany({
      where: esOrg ? { id_organizador_inscrito: id } : { id_visitante: id },
      data: {
        nombre: actualizada.nombre,
        gmail: actualizada.gmail,
        dni: actualizada.dni,
        numero_tel: actualizada.numero_tel,
      },
    });
    return { antes, actualizada };
  });
