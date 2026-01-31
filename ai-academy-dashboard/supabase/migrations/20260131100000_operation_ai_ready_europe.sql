-- Migration: Operation AI Ready Europe - Full Schema
-- Date: 2026-01-31
-- Description: Adds mission system, task forces, pilot clients, intel drops,
--              mastery levels, recognitions, and live sessions

-- Enable pgcrypto extension for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- PILOT CLIENTS (4 fictional EU enterprises)
-- ============================================================================

CREATE TABLE pilot_clients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  codename TEXT,
  sector TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  employees INTEGER,

  -- Client profile
  situation TEXT,
  pain_points TEXT[],
  ai_act_concern TEXT,
  stakeholder_name TEXT,
  stakeholder_title TEXT,
  urgency TEXT CHECK (urgency IN ('low', 'medium', 'high', 'critical')),

  -- Visual
  icon TEXT,
  color TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed pilot clients
INSERT INTO pilot_clients (name, codename, sector, country, city, employees, situation, pain_points, ai_act_concern, stakeholder_name, stakeholder_title, urgency, icon, color) VALUES
('RheinBank AG', 'Target: RheinBank', 'Financial Services', 'Germany', 'Frankfurt', 12400,
 'Traditional German bank struggling to compete with digital challengers. Customer service costs are unsustainable.',
 ARRAY['340 FTE call center, 65% repetitive queries', 'Average resolution time: 12 minutes', '23% customer abandonment before connection', 'No 24/7 support capability'],
 'High-risk AI for credit decisions', 'Klaus Weber', 'Chief Digital Officer', 'high', '🏦', '#1E40AF'),

('Groupe Industriel Lyon', 'Target: Groupe Industriel', 'Manufacturing', 'France', 'Lyon', 8200,
 'Precision manufacturing company facing quality and efficiency challenges. Competitors in Asia are 30% more efficient.',
 ARRAY['15% unplanned downtime, €2M/month losses', 'Quality defect rate: 2.3% (target: 0.5%)', 'Maintenance still reactive, not predictive', 'Production planning done in spreadsheets'],
 'Safety-critical AI in production systems', 'Marie Dubois', 'VP Operations', 'critical', '🏭', '#7C3AED'),

('Pharma Nord Italia', 'Target: Pharma Nord', 'Healthcare', 'Italy', 'Milan', 5600,
 'Mid-size pharmaceutical company drowning in regulatory documentation. Drug approval timelines are 40% longer than competitors.',
 ARRAY['15,000 documents/month processed manually', '6-month document review cycle', '30% rework rate on submissions', 'Clinical trial data scattered across 12 systems'],
 'Medical device regulations + AI Act intersection', 'Dr. Alessandro Rossi', 'Head of R&D', 'medium', '💊', '#059669'),

('EnergieNet Nederland', 'Target: EnergieNet', 'Energy', 'Netherlands', 'Amsterdam', 3400,
 'Grid operator facing unprecedented complexity from renewable integration. Prediction errors causing major financial penalties.',
 ARRAY['23% forecast error rate (industry standard: 8%)', '€5M annual penalties for grid imbalances', 'Incident response time: 45 minutes average', 'Legacy SCADA systems with no AI integration'],
 'Critical infrastructure AI governance', 'Jan van der Berg', 'Chief Technology Officer', 'high', '⚡', '#DC2626');

-- ============================================================================
-- TASK FORCES (4 teams assigned to pilot clients)
-- ============================================================================

CREATE TABLE task_forces (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,  -- 'RHEIN', 'LYON', 'MILAN', 'AMSTERDAM'
  display_name TEXT NOT NULL,
  client_id INT REFERENCES pilot_clients(id),
  starting_size INT DEFAULT 50,
  current_size INT DEFAULT 50,

  -- Stats
  overall_readiness DECIMAL(5,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed task forces
INSERT INTO task_forces (name, display_name, client_id) VALUES
('RHEIN', 'Task Force RHEIN', 1),
('LYON', 'Task Force LYON', 2),
('MILAN', 'Task Force MILAN', 3),
('AMSTERDAM', 'Task Force AMSTERDAM', 4);

-- ============================================================================
-- TASK FORCE MEMBERS (links participants to task forces)
-- ============================================================================

CREATE TABLE task_force_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_force_id INT REFERENCES task_forces(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  is_team_lead BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(participant_id)  -- Each participant can only be in one task force
);

CREATE INDEX idx_task_force_members_task_force ON task_force_members(task_force_id);
CREATE INDEX idx_task_force_members_participant ON task_force_members(participant_id);

-- ============================================================================
-- MISSION DAYS (25-day curriculum with narrative)
-- ============================================================================

CREATE TABLE mission_days (
  id SERIAL PRIMARY KEY,
  day INT UNIQUE NOT NULL CHECK (day BETWEEN 1 AND 25),

  -- Computed fields
  week INT GENERATED ALWAYS AS (
    CASE WHEN day <= 5 THEN 1
         WHEN day <= 10 THEN 2
         WHEN day <= 15 THEN 4
         ELSE 5 END
  ) STORED,
  act INT GENERATED ALWAYS AS (
    CASE WHEN day <= 5 THEN 1   -- ACT 1: Call to Action
         WHEN day <= 10 THEN 2  -- ACT 2: Skill Building
         WHEN day <= 15 THEN 3  -- ACT 3: Team Deployment
         ELSE 4 END             -- ACT 4: Final Push
  ) STORED,

  -- Content
  title TEXT NOT NULL,
  codename TEXT,  -- e.g., "Foundation Building"
  subtitle TEXT,

  -- Briefing content (Markdown)
  briefing_content TEXT,
  resources_content TEXT,

  -- Tech focus
  tech_skills_focus TEXT[],

  -- Targeting
  target_roles TEXT[],  -- NULL = all roles

  -- Unlock logic
  unlock_date DATE,
  is_visible BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed mission days (25 days)
INSERT INTO mission_days (day, title, codename, subtitle, tech_skills_focus, unlock_date, is_visible) VALUES
-- ACT 1: THE CALL TO ACTION (Week 1)
(1, 'The Commission''s Request', 'Day One', 'Opening video, mission briefing, stakes established',
   ARRAY['LLM Fundamentals', 'OpenAI/Claude/Gemini APIs'], '2026-02-02', true),
(2, 'Understanding the Landscape', 'The Landscape', 'AI Act deep dive, competitive landscape',
   ARRAY['Prompt Engineering', 'Context Optimization'], '2026-02-03', true),
(3, 'Choosing Your Tools', 'Tool Selection', 'Agentic patterns, rapid deployment architecture',
   ARRAY['Agentic Patterns', 'LangChain/CrewAI'], '2026-02-04', true),
(4, 'Finding Your Role', 'Specialization', 'Role selection and first drill',
   ARRAY['Role-specific tooling'], '2026-02-05', true),
(5, 'First Client Brief', 'Client Intro', 'Introduction to pilot clients, Week 1 checkpoint',
   ARRAY['Client engagement', 'Problem framing'], '2026-02-06', true),

-- ACT 2: SKILL BUILDING (Week 2)
(6, 'Foundation Building', 'Core Skill #1', 'Role-specific intensive training begins',
   ARRAY['RAG', 'Vector Databases', 'Pinecone', 'ChromaDB'], '2026-02-09', true),
(7, 'Integration Patterns', 'Core Skill #2', 'Connecting systems and data flows',
   ARRAY['CI/CD', 'Docker', 'FastAPI'], '2026-02-10', true),
(8, 'Deployment Readiness', 'Core Skill #3', 'Production deployment patterns',
   ARRAY['Azure', 'Kubernetes', 'Model Serving'], '2026-02-11', true),
(9, 'Handling Complexity', 'Advanced Patterns', 'Multi-agent systems and tool calling',
   ARRAY['Multi-agent Systems', 'Tool Calling'], '2026-02-12', true),
(10, 'Week 2 Synthesis', 'Checkpoint', 'Evaluation and reflection',
    ARRAY['Evaluation', 'MLflow', 'LangSmith'], '2026-02-13', true),

-- SPRING BREAK (Week 3: Feb 16-22) - No new days, self-paced

-- ACT 3: TEAM DEPLOYMENT (Week 4)
(11, 'Team Formation', 'Assemble', 'Cross-functional teams, client assignment',
    ARRAY['Team coordination', 'Problem framing'], '2026-02-23', true),
(12, 'Problem Framing', 'Define', 'Deep dive into client problems',
    ARRAY['Requirements gathering', 'Stakeholder management'], '2026-02-24', true),
(13, 'Solution Design', 'Architect', 'Architecture decisions and planning',
    ARRAY['System design', 'Architecture patterns'], '2026-02-25', true),
(14, 'Build Sprint #1', 'Build Day 1', 'Working prototype development',
    ARRAY['Rapid prototyping', 'Agile development'], '2026-02-26', true),
(15, 'Build Sprint #1', 'Build Day 2', 'Continue prototype, Week 4 checkpoint',
    ARRAY['Integration', 'Demo preparation'], '2026-02-27', true),

-- ACT 4: FINAL PUSH (Week 5)
(16, 'Build Sprint #2', 'Feature Complete', 'Feature completion',
    ARRAY['Feature development', 'Testing'], '2026-03-02', true),
(17, 'Build Sprint #2', 'Integration', 'System integration',
    ARRAY['Integration testing', 'Bug fixes'], '2026-03-03', true),
(18, 'Security Review', 'Harden', 'Security review and hardening',
    ARRAY['Security audit', 'Penetration testing'], '2026-03-04', true),
(19, 'Cross-Team Review', 'Peer Review', 'Peer review and feedback',
    ARRAY['Code review', 'Feedback incorporation'], '2026-03-05', true),
(20, 'Bug Fixes', 'Refinement', 'Address peer review findings',
    ARRAY['Bug fixing', 'Refinement'], '2026-03-06', true),
(21, 'Documentation', 'Document', 'Complete documentation',
    ARRAY['Technical writing', 'Documentation'], '2026-03-09', true),
(22, 'Demo Script', 'Script', 'Prepare demo scripts',
    ARRAY['Presentation skills', 'Demo preparation'], '2026-03-10', true),
(23, 'Technical Dry-Run', 'Rehearse', 'Technical rehearsal',
    ARRAY['Demo execution', 'Troubleshooting'], '2026-03-11', true),
(24, 'Presentation Prep', 'Polish', 'Final presentation preparation',
    ARRAY['Presentation design', 'Public speaking'], '2026-03-12', true),
(25, 'Final Checkpoint', 'Launch Ready', 'Final preparations for hackathon',
    ARRAY['Final review', 'Launch preparation'], '2026-03-13', true);

CREATE INDEX idx_mission_days_day ON mission_days(day);
CREATE INDEX idx_mission_days_week ON mission_days(week);
CREATE INDEX idx_mission_days_act ON mission_days(act);
CREATE INDEX idx_mission_days_unlock ON mission_days(unlock_date);

-- ============================================================================
-- INTEL DROPS (Surprise briefings)
-- ============================================================================

CREATE TABLE intel_drops (
  id SERIAL PRIMARY KEY,
  day INT NOT NULL,
  trigger_time TIME,  -- When to show (optional)

  title TEXT NOT NULL,
  classification TEXT DEFAULT 'BRIEFING',  -- BRIEFING, URGENT, CLASSIFIED
  content TEXT NOT NULL,

  affected_task_forces TEXT[],  -- NULL = all teams

  is_released BOOLEAN DEFAULT false,
  released_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed intel drops from the plan
INSERT INTO intel_drops (day, title, classification, content, affected_task_forces) VALUES
(5, 'ESCALATION ALERT', 'URGENT',
 E'Field report from our account team in Frankfurt:\n\nRheinBank''s board meeting moved up. CEO is under pressure to show AI progress within 60 days or face investor concerns.\n\nKlaus Weber (CDO) has requested an urgent capability briefing.\n\nIMPLICATION: Task Force RHEIN - prepare for accelerated timeline.',
 ARRAY['RHEIN']),

(7, 'COMPETITOR SIGHTING', 'CLASSIFIED',
 E'Subject: Competitive Activity Detected\n\nOur sources report that Accenture has approached Groupe Industriel Lyon with an AI transformation proposal.\n\nTheir pitch: "End-to-end AI strategy and implementation"\nTheir timeline: 18 months\nTheir team: 45 consultants\nTheir price: €4.2M\n\nMarie Dubois is meeting with them next week.\n\nOUR ADVANTAGE: We can deliver a working PoC before they finish their discovery phase. Speed is everything.\n\nTask Force LYON - prepare to demonstrate our approach.',
 ARRAY['LYON']),

(18, 'TIMELINE UPDATE', 'URGENT',
 E'FROM CEO OFFICE:\n\nJust off a call with Commissioner Vestager.\n\nThe EU AI Office wants to showcase pilot results at the Digital Assembly in Brussels - March 20.\n\nThat''s 5 days after your final presentations.\n\nTranslation: Your demos may be shown to EU ministers.\n\nRaise your game accordingly.\n\n- Martin',
 NULL),

(14, 'STAKEHOLDER CHANGE', 'BRIEFING',
 E'Client update: EnergieNet Nederland\n\nJan van der Berg (CTO) has been promoted to CEO effective immediately. New CTO is Sofie Jansen - background in cybersecurity.\n\nHer first question to our account team:\n"How do we know this AI system won''t create security vulnerabilities in our grid management?"\n\nIMPLICATION: AI-SEC members of Task Force AMSTERDAM - prepare a security briefing. This is now a priority conversation.',
 ARRAY['AMSTERDAM']),

(21, 'FINAL STAKES', 'CLASSIFIED',
 E'CONFIRMED - COMMISSION ATTENDANCE\n\nMarch 15 attendance confirmed:\n\n• Representative from EU AI Office\n• Digital transformation leads from all 4 pilot companies\n• Kyndryl European leadership team\n• Selected industry press (under NDA)\n\nThis is no longer an internal exercise.\nThis is a client presentation.\n\nPrepare accordingly.',
 NULL);

CREATE INDEX idx_intel_drops_day ON intel_drops(day);
CREATE INDEX idx_intel_drops_released ON intel_drops(is_released);

-- ============================================================================
-- MASTERY LEVELS / CLEARANCE (Progress tracking)
-- ============================================================================

CREATE TYPE clearance_level AS ENUM ('TRAINEE', 'FIELD_TRAINEE', 'FIELD_READY', 'SPECIALIST');

CREATE TABLE participant_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,

  -- Current level
  clearance clearance_level DEFAULT 'TRAINEE',
  mastery_level INT DEFAULT 1 CHECK (mastery_level BETWEEN 1 AND 4),

  -- Progress stats
  days_completed INT DEFAULT 0,
  artifacts_submitted INT DEFAULT 0,
  ai_tutor_sessions INT DEFAULT 0,
  peer_assists_given INT DEFAULT 0,

  -- Checkpoints
  week1_checkpoint_passed BOOLEAN DEFAULT false,
  week2_checkpoint_passed BOOLEAN DEFAULT false,
  week4_checkpoint_passed BOOLEAN DEFAULT false,
  week5_checkpoint_passed BOOLEAN DEFAULT false,

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(participant_id)
);

CREATE INDEX idx_participant_mastery_participant ON participant_mastery(participant_id);
CREATE INDEX idx_participant_mastery_clearance ON participant_mastery(clearance);

-- Auto-create mastery record when participant joins
CREATE OR REPLACE FUNCTION create_participant_mastery()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO participant_mastery (participant_id)
  VALUES (NEW.id)
  ON CONFLICT (participant_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_mastery
AFTER INSERT ON participants
FOR EACH ROW EXECUTE FUNCTION create_participant_mastery();

-- ============================================================================
-- RECOGNITIONS (Non-competitive acknowledgments)
-- ============================================================================

CREATE TABLE recognition_types (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  description TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed recognition types from plan
INSERT INTO recognition_types (code, name, icon, description) VALUES
('early_riser', 'Early Riser', '🌅', 'Consistent morning engagement before sessions'),
('night_scholar', 'Night Scholar', '🌙', 'Dedication to after-hours learning'),
('steady_progress', 'Steady Progress', '📈', 'Consistent daily advancement'),
('momentum', 'Momentum', '🔥', '5+ consecutive days with submissions'),
('team_supporter', 'Team Supporter', '🤝', 'Helping teammates overcome blockers'),
('problem_solver', 'Problem Solver', '💡', 'Creative solutions to challenging situations'),
('thorough', 'Thorough', '📝', 'High-quality documentation and artifacts'),
('precision', 'Precision', '🎯', 'Accurate, well-tested implementations'),
('security_mindset', 'Security Mindset', '🛡️', 'Proactive security considerations'),
('mentor_spirit', 'Mentor Spirit', '🎓', 'Going above to help others learn');

CREATE TABLE participant_recognitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  recognition_type_id INT REFERENCES recognition_types(id) ON DELETE CASCADE,
  context TEXT,  -- Optional: why they earned it
  earned_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(participant_id, recognition_type_id)
);

CREATE INDEX idx_participant_recognitions_participant ON participant_recognitions(participant_id);

-- ============================================================================
-- LIVE SESSIONS (Instructor sync mode)
-- ============================================================================

CREATE TABLE live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES participants(id),
  mission_day_id INT REFERENCES mission_days(id),

  -- State
  current_step INT DEFAULT 0,
  current_section TEXT DEFAULT 'briefing',

  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,

  -- Join code (6 chars uppercase hex) - generated by app or trigger
  join_code TEXT UNIQUE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE live_session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(session_id, participant_id)
);

-- Generate join code trigger
CREATE OR REPLACE FUNCTION generate_live_session_join_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.join_code IS NULL THEN
    NEW.join_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_join_code
BEFORE INSERT ON live_sessions
FOR EACH ROW EXECUTE FUNCTION generate_live_session_join_code();

CREATE INDEX idx_live_sessions_active ON live_sessions(is_active) WHERE is_active = true;
CREATE INDEX idx_live_sessions_join_code ON live_sessions(join_code);
CREATE INDEX idx_live_session_participants_session ON live_session_participants(session_id);

-- ============================================================================
-- MISSION PROGRESS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW mission_progress_view AS
SELECT
  p.id as participant_id,
  p.github_username,
  p.name,
  p.role,
  tf.name as task_force,
  pc.name as client_name,
  pm.clearance,
  pm.mastery_level,
  pm.days_completed,
  pm.artifacts_submitted,
  (
    SELECT COUNT(*)
    FROM participant_recognitions pr
    WHERE pr.participant_id = p.id
  ) as recognitions_earned
FROM participants p
LEFT JOIN task_force_members tfm ON tfm.participant_id = p.id
LEFT JOIN task_forces tf ON tf.id = tfm.task_force_id
LEFT JOIN pilot_clients pc ON pc.id = tf.client_id
LEFT JOIN participant_mastery pm ON pm.participant_id = p.id;

-- ============================================================================
-- TASK FORCE READINESS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW task_force_readiness_view AS
SELECT
  tf.id as task_force_id,
  tf.name as task_force_name,
  tf.display_name,
  pc.name as client_name,
  pc.urgency as client_urgency,
  COUNT(tfm.participant_id) as member_count,
  COUNT(CASE WHEN pm.clearance = 'SPECIALIST' THEN 1 END) as specialists,
  COUNT(CASE WHEN pm.clearance = 'FIELD_READY' THEN 1 END) as field_ready,
  COUNT(CASE WHEN pm.clearance = 'FIELD_TRAINEE' THEN 1 END) as field_trainees,
  COUNT(CASE WHEN pm.clearance = 'TRAINEE' THEN 1 END) as trainees,
  ROUND(AVG(pm.mastery_level) * 25, 0) as overall_readiness_pct
FROM task_forces tf
LEFT JOIN pilot_clients pc ON pc.id = tf.client_id
LEFT JOIN task_force_members tfm ON tfm.task_force_id = tf.id
LEFT JOIN participant_mastery pm ON pm.participant_id = tfm.participant_id
GROUP BY tf.id, tf.name, tf.display_name, pc.name, pc.urgency;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE pilot_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_forces ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_force_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE intel_drops ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE recognition_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_recognitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_session_participants ENABLE ROW LEVEL SECURITY;

-- Public read access for most tables
CREATE POLICY "Public read pilot_clients" ON pilot_clients FOR SELECT USING (true);
CREATE POLICY "Public read task_forces" ON task_forces FOR SELECT USING (true);
CREATE POLICY "Public read task_force_members" ON task_force_members FOR SELECT USING (true);
CREATE POLICY "Public read mission_days" ON mission_days FOR SELECT USING (is_visible = true OR unlock_date <= CURRENT_DATE);
CREATE POLICY "Public read released intel_drops" ON intel_drops FOR SELECT USING (is_released = true);
CREATE POLICY "Public read participant_mastery" ON participant_mastery FOR SELECT USING (true);
CREATE POLICY "Public read recognition_types" ON recognition_types FOR SELECT USING (true);
CREATE POLICY "Public read participant_recognitions" ON participant_recognitions FOR SELECT USING (true);
CREATE POLICY "Public read live_sessions" ON live_sessions FOR SELECT USING (true);
CREATE POLICY "Public read live_session_participants" ON live_session_participants FOR SELECT USING (true);

-- Service role can modify
CREATE POLICY "Service insert task_force_members" ON task_force_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update task_force_members" ON task_force_members FOR UPDATE USING (true);
CREATE POLICY "Service insert participant_mastery" ON participant_mastery FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update participant_mastery" ON participant_mastery FOR UPDATE USING (true);
CREATE POLICY "Service insert participant_recognitions" ON participant_recognitions FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert live_sessions" ON live_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update live_sessions" ON live_sessions FOR UPDATE USING (true);
CREATE POLICY "Service insert live_session_participants" ON live_session_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update live_session_participants" ON live_session_participants FOR UPDATE USING (true);
CREATE POLICY "Service update intel_drops" ON intel_drops FOR UPDATE USING (true);
