-- ============================================================
-- LUCID AGENCY — Schema complet Supabase
-- Coller dans : Supabase > SQL Editor > New query
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('freelancer', 'admin', 'client')) DEFAULT 'freelancer',
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table freelancers
CREATE TABLE IF NOT EXISTS freelancers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  specialty TEXT NOT NULL DEFAULT '',
  experience_years INTEGER,
  portfolio_url TEXT,
  linkedin_url TEXT,
  rate_per_hour NUMERIC(10, 2),
  skills TEXT[] DEFAULT '{}',
  bio TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table contact_submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  email TEXT NOT NULL,
  type TEXT,
  budget TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users see own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin see all profiles" ON profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- Freelancers
CREATE POLICY "Public see approved freelancers" ON freelancers FOR SELECT USING (status = 'approved');
CREATE POLICY "Freelancer see own" ON freelancers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Freelancer update own" ON freelancers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Freelancer insert own" ON freelancers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin see all freelancers" ON freelancers FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Contact submissions
CREATE POLICY "Anyone can submit" ON contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin read submissions" ON contact_submissions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- ============================================================
-- TRIGGER updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER freelancers_updated_at BEFORE UPDATE ON freelancers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- CRÉER UN COMPTE ADMIN (remplacer l'email et le mot de passe)
-- À exécuter APRÈS avoir créé le compte depuis l'interface Supabase Auth
-- Remplacez 'VOTRE_USER_ID' par l'UUID visible dans Auth > Users
-- ============================================================
-- INSERT INTO profiles (user_id, email, first_name, last_name, role)
-- VALUES ('VOTRE_USER_ID', 'admin@lucid-agency.com', 'Admin', 'LUCID', 'admin');
