DROP TABLE IF EXISTS record_tasks;
DROP TABLE IF EXISTS daily_records;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS work_sites;
DROP TABLE IF EXISTS workers;

CREATE TABLE workers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL
);

CREATE TABLE work_sites (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL
);

CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL
);

CREATE TABLE daily_records (
  id SERIAL PRIMARY KEY,
  record_date DATE NOT NULL,
  worker_name VARCHAR(150) NOT NULL,
  record_type VARCHAR(50) NOT NULL,
  site_id INTEGER REFERENCES work_sites(id),
  food VARCHAR(30),
  transport VARCHAR(30),
  observations VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE record_tasks (
  id SERIAL PRIMARY KEY,
  record_id INTEGER REFERENCES daily_records(id) ON DELETE CASCADE,
  task_id INTEGER REFERENCES tasks(id),
  hours NUMERIC(4,2) NOT NULL
);

INSERT INTO workers (name) VALUES
('Jesus Saturnino Verdu'),
('Jose Maria Verdu Lopez'),
('Jose Maria Ruescas'),
('Gheorghe Ovidiu Bora'),
('Miguel Angel Gabaldon'),
('Moises Gallego'),
('Ibrahim'),
('Jaime Melquiades Mora'),
('Otro...');

INSERT INTO work_sites (name) VALUES
('4 UNIFAMILIARES PERI-10'),
('ASCENSOR COMUNIDAD VECINOS HASAN'),
('BUENACHE UNIFAMILIAR PACO'),
('HOSPITAL CUENCA'),
('MIRA CUARTEL GUARDIA CIVIL'),
('NAVE CRESVER80'),
('Otra...'),
('PISCINA ALARCÓN'),
('SEÑORÍO UNIFAMILIAR BEA');

INSERT INTO tasks (name) VALUES
('ALBAÑILERÍA'),
('ALICATADOS Y SOLADOS'),
('ALUMINIOS'),
('CALEFACCIÓN'),
('CARPINTERÍA MADERA'),
('CERRAJERÍA'),
('CERRAMIENTO FACHADA'),
('CIMENTACIÓN'),
('CUBIERTA DE TEJA'),
('ELECTRICIDAD'),
('ESTRUCTURA Y FORJADOS'),
('FONTANERÍA'),
('LIMPIEZA'),
('MAQUINARIA'),
('MOVIMIENTOS DE TIERRAS'),
('MUROS'),
('No Asistencia (Justificada)'),
('No Asistencia (Sin Justificar)'),
('PILOTES'),
('REMATES'),
('SANEAMIENTO'),
('TABIQUERÍA'),
('TERRAZAS'),
('URBANIZACIÓN'),
('VARIOS'),
('YESOS');