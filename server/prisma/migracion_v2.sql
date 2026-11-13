-- CulturedPass v2 · Regla 11: fecha final opcional
-- Ejecutar UNA vez en Supabase > SQL Editor.
-- Los eventos que ya existen quedan con fecha_final = NULL (sin cambios).

BEGIN;

ALTER TABLE evento ADD COLUMN IF NOT EXISTS fecha_final DATE;

-- La regla vieja exigía SIEMPRE hora_finalizacion > hora_inicio.
-- La nueva solo la exige cuando NO hay fecha final.
ALTER TABLE evento DROP CONSTRAINT IF EXISTS ck_evento_horas;
ALTER TABLE evento ADD CONSTRAINT ck_evento_horas
  CHECK (fecha_final IS NOT NULL OR hora_finalizacion > hora_inicio);

-- La fecha final solo puede ser exactamente un día después de fecha_evento.
ALTER TABLE evento DROP CONSTRAINT IF EXISTS ck_evento_fecha_final;
ALTER TABLE evento ADD CONSTRAINT ck_evento_fecha_final
  CHECK (fecha_final IS NULL OR fecha_final = fecha_evento + 1);

COMMIT;
