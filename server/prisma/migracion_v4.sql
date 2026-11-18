-- =====================================================================
-- CulturedPass v4 · "Mis boletos": cada boleto queda vinculado a la cuenta que se inscribió
-- Ejecutar UNA vez en Supabase > SQL Editor (todo el script junto, dentro de una transacción).
-- =====================================================================
BEGIN;

ALTER TABLE boleto ADD COLUMN IF NOT EXISTS id_visitante            INTEGER;
ALTER TABLE boleto ADD COLUMN IF NOT EXISTS id_organizador_inscrito INTEGER;

-- Si se borra la cuenta, el boleto se conserva (solo se quita el vínculo)
ALTER TABLE boleto ADD CONSTRAINT fk_boleto_visitante
  FOREIGN KEY (id_visitante) REFERENCES visitante (id_visitante) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE boleto ADD CONSTRAINT fk_boleto_organizador_inscrito
  FOREIGN KEY (id_organizador_inscrito) REFERENCES organizador (id_organizador) ON DELETE SET NULL ON UPDATE CASCADE;

-- Un boleto pertenece como máximo a UNA cuenta
ALTER TABLE boleto ADD CONSTRAINT ck_boleto_una_cuenta
  CHECK (id_visitante IS NULL OR id_organizador_inscrito IS NULL);

CREATE INDEX idx_boleto_visitante            ON boleto (id_visitante);
CREATE INDEX idx_boleto_organizador_inscrito ON boleto (id_organizador_inscrito);

-- Vincula los boletos que YA existen con la cuenta que tiene su mismo DNI o correo
UPDATE boleto b
   SET id_visitante = v.id_visitante
  FROM visitante v
 WHERE b.id_visitante IS NULL AND b.id_organizador_inscrito IS NULL
   AND (b.dni = v.dni OR b.gmail = v.gmail);

UPDATE boleto b
   SET id_organizador_inscrito = o.id_organizador
  FROM organizador o
 WHERE b.id_visitante IS NULL AND b.id_organizador_inscrito IS NULL
   AND (b.dni = o.dni OR b.gmail = o.gmail);

COMMIT;

-- Verificación (opcional): cuántos boletos quedaron vinculados
-- SELECT count(*) FILTER (WHERE id_visitante IS NOT NULL OR id_organizador_inscrito IS NOT NULL) AS vinculados,
--        count(*) AS total FROM boleto;
