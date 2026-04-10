CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  line_user_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  birth_date DATE,
  height_cm DECIMAL(5,1),
  start_weight_kg DECIMAL(5,2),
  target_weight_kg DECIMAL(5,2),
  body_type TEXT CHECK (body_type IN ('fat_sensitive', 'carb_sensitive')),
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  course_type TEXT NOT NULL CHECK (course_type IN ('5w', '7w', '9w')),
  is_repeat BOOLEAN DEFAULT FALSE,
  start_date DATE NOT NULL,
  scheduled_end DATE NOT NULL,
  actual_end DATE,
  extensions INTEGER DEFAULT 0,
  price_massage DECIMAL(10,0) NOT NULL,
  price_knowhow DECIMAL(10,0) NOT NULL,
  price_advice DECIMAL(10,0) NOT NULL,
  price_total DECIMAL(10,0) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE treatments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  treatment_date DATE NOT NULL,
  session_number INTEGER NOT NULL CHECK (session_number BETWEEN 1 AND 9),
  lymph_massage BOOLEAN DEFAULT TRUE,
  infrared_mat BOOLEAN DEFAULT FALSE,
  duration_min INTEGER DEFAULT 120,
  body_areas TEXT,
  therapist_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE weight_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  log_date DATE NOT NULL,
  day_number INTEGER CHECK (day_number BETWEEN 1 AND 63),
  morning_kg DECIMAL(5,2),
  evening_kg DECIMAL(5,2),
  pre_treatment_kg DECIMAL(5,2),
  post_treatment_kg DECIMAL(5,2),
  is_menstrual BOOLEAN DEFAULT FALSE,
  treatment_id UUID REFERENCES treatments(id) ON DELETE SET NULL,
  source TEXT DEFAULT 'manual' CHECK (source IN ('line', 'manual', 'liff')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, log_date)
);

CREATE TABLE foods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  food_code TEXT,
  name TEXT NOT NULL,
  name_kana TEXT,
  category TEXT NOT NULL,
  serving_g DECIMAL(6,1) DEFAULT 100,
  calories_kcal DECIMAL(6,1) NOT NULL,
  protein_g DECIMAL(5,1) NOT NULL,
  fat_g DECIMAL(5,1) NOT NULL,
  carb_g DECIMAL(5,1) NOT NULL,
  pg_status TEXT NOT NULL CHECK (pg_status IN ('ok', 'ng', 'limited')),
  pg_note TEXT,
  fat_warning BOOLEAN DEFAULT FALSE,
  carb_warning BOOLEAN DEFAULT FALSE,
  source TEXT DEFAULT 'mext' CHECK (source IN ('mext', 'custom')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_foods_name ON foods USING gin (to_tsvector('simple', name));
CREATE INDEX idx_foods_name_kana ON foods USING gin (to_tsvector('simple', name_kana));
CREATE INDEX idx_foods_category ON foods (category);
CREATE INDEX idx_foods_pg_status ON foods (pg_status);

CREATE TABLE meal_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  report_date DATE NOT NULL,
  day_number INTEGER,
  water_ml DECIMAL(6,0),
  compliance TEXT CHECK (compliance IN ('ok', 'ng', 'partial')),
  ng_reason TEXT,
  therapist_comment TEXT,
  day_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, report_date)
);

CREATE TABLE meal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_report_id UUID NOT NULL REFERENCES meal_reports(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_id UUID REFERENCES foods(id) ON DELETE SET NULL,
  food_name_override TEXT,
  quantity_g DECIMAL(6,1) NOT NULL,
  servings DECIMAL(4,2) DEFAULT 1.0,
  calories_kcal DECIMAL(6,1) NOT NULL,
  protein_g DECIMAL(5,1) NOT NULL,
  fat_g DECIMAL(5,1) NOT NULL,
  carb_g DECIMAL(5,1) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE meal_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_report_id UUID NOT NULL REFERENCES meal_reports(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE followups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  followup_type TEXT NOT NULL CHECK (followup_type IN ('rebound_check', 'repeat_offer', 'anniversary')),
  scheduled_date DATE NOT NULL,
  sent_date DATE,
  channel TEXT DEFAULT 'line' CHECK (channel IN ('line', 'phone')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'responded')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_courses_client ON courses (client_id);
CREATE INDEX idx_courses_status ON courses (status);
CREATE INDEX idx_weight_logs_client_date ON weight_logs (client_id, log_date);
CREATE INDEX idx_meal_reports_client_date ON meal_reports (client_id, report_date);
CREATE INDEX idx_meal_entries_report ON meal_entries (meal_report_id);
CREATE INDEX idx_treatments_course ON treatments (course_id);
CREATE INDEX idx_followups_status ON followups (status, scheduled_date);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Foods are viewable by everyone" ON foods FOR SELECT USING (true);

CREATE POLICY "Clients can view own data" ON clients FOR SELECT USING (
  auth.jwt() ->> 'line_user_id' = line_user_id
);
CREATE POLICY "Clients can view own courses" ON courses FOR SELECT USING (
  client_id IN (SELECT id FROM clients WHERE line_user_id = auth.jwt() ->> 'line_user_id')
);
CREATE POLICY "Clients can view own weight_logs" ON weight_logs FOR SELECT USING (
  client_id IN (SELECT id FROM clients WHERE line_user_id = auth.jwt() ->> 'line_user_id')
);
CREATE POLICY "Clients can insert own weight_logs" ON weight_logs FOR INSERT WITH CHECK (
  client_id IN (SELECT id FROM clients WHERE line_user_id = auth.jwt() ->> 'line_user_id')
);
CREATE POLICY "Clients can view own meal_reports" ON meal_reports FOR SELECT USING (
  client_id IN (SELECT id FROM clients WHERE line_user_id = auth.jwt() ->> 'line_user_id')
);
CREATE POLICY "Clients can insert own meal_reports" ON meal_reports FOR INSERT WITH CHECK (
  client_id IN (SELECT id FROM clients WHERE line_user_id = auth.jwt() ->> 'line_user_id')
);
CREATE POLICY "Clients can view own meal_entries" ON meal_entries FOR SELECT USING (
  meal_report_id IN (
    SELECT id FROM meal_reports WHERE client_id IN (
      SELECT id FROM clients WHERE line_user_id = auth.jwt() ->> 'line_user_id'
    )
  )
);
CREATE POLICY "Clients can insert own meal_entries" ON meal_entries FOR INSERT WITH CHECK (
  meal_report_id IN (
    SELECT id FROM meal_reports WHERE client_id IN (
      SELECT id FROM clients WHERE line_user_id = auth.jwt() ->> 'line_user_id'
    )
  )
);

CREATE VIEW v_daily_pfc AS
SELECT
  mr.client_id,
  mr.report_date,
  mr.day_number,
  COALESCE(SUM(me.protein_g), 0) AS total_protein_g,
  COALESCE(SUM(me.fat_g), 0) AS total_fat_g,
  COALESCE(SUM(me.carb_g), 0) AS total_carb_g,
  COALESCE(SUM(me.calories_kcal), 0) AS total_calories,
  COUNT(me.id) AS entry_count,
  mr.compliance,
  mr.day_complete
FROM meal_reports mr
LEFT JOIN meal_entries me ON me.meal_report_id = mr.id
GROUP BY mr.id;

CREATE VIEW v_treatment_effect AS
SELECT
  t.id AS treatment_id,
  t.client_id,
  t.course_id,
  t.treatment_date,
  t.session_number,
  t.lymph_massage,
  t.infrared_mat,
  wl.pre_treatment_kg,
  wl.post_treatment_kg,
  (wl.pre_treatment_kg - wl.post_treatment_kg) AS weight_diff_kg
FROM treatments t
JOIN weight_logs wl ON wl.treatment_id = t.id
WHERE wl.pre_treatment_kg IS NOT NULL AND wl.post_treatment_kg IS NOT NULL;

CREATE VIEW v_course_summary AS
SELECT
  c.id AS course_id,
  c.client_id,
  c.course_type,
  c.is_repeat,
  c.status,
  cl.start_weight_kg,
  cl.target_weight_kg,
  cl.body_type,
  (SELECT wl.morning_kg FROM weight_logs wl WHERE wl.course_id = c.id ORDER BY wl.log_date DESC LIMIT 1) AS latest_weight,
  (cl.start_weight_kg - (SELECT wl.morning_kg FROM weight_logs wl WHERE wl.course_id = c.id ORDER BY wl.log_date DESC LIMIT 1)) AS total_lost,
  c.extensions,
  c.price_total
FROM courses c
JOIN clients cl ON cl.id = c.client_id;
