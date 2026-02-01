-- ============================================================================
-- PARTICIPANT PREREQUISITES TRACKING
-- Tracks which tools and access each participant has before the course starts
-- ============================================================================

-- Prerequisites template table - defines what prerequisites exist
CREATE TABLE IF NOT EXISTS prerequisite_items (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    help_url TEXT,
    is_required BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participant prerequisites tracking
CREATE TABLE IF NOT EXISTS participant_prerequisites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    prerequisite_id INTEGER NOT NULL REFERENCES prerequisite_items(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(participant_id, prerequisite_id)
);

-- Insert prerequisite items
INSERT INTO prerequisite_items (code, category, name, description, help_url, is_required, display_order) VALUES
-- Development Environment
('github_account', 'development', 'GitHub Account', 'Private GitHub account for code submissions and portfolio', 'https://github.com/signup', true, 1),
('ide_installed', 'development', 'VS Code or Cursor IDE', 'Modern IDE with AI extension support installed', 'https://code.visualstudio.com/', true, 2),
('git_cli', 'development', 'Git CLI', 'Git command line tools installed and configured', 'https://git-scm.com/downloads', true, 3),

-- Enterprise AI Platforms
('chatgpt_enterprise', 'ai_platforms', 'ChatGPT Enterprise', 'Access to ChatGPT Enterprise via AI Garage portal', 'https://aigarage.kyndryl.com', true, 10),
('github_copilot', 'ai_platforms', 'GitHub Copilot', 'GitHub Copilot license activated for your account', 'https://github.com/features/copilot', true, 11),
('claude_access', 'ai_platforms', 'Claude Access', 'Access to Claude via Anthropic Console or API', 'https://console.anthropic.com', true, 12),
('gemini_access', 'ai_platforms', 'Google Gemini', 'Access to Gemini Advanced or API', 'https://gemini.google.com', false, 13),

-- Google Workspace
('google_id_okta', 'google', 'Google ID (via Okta)', 'Google Workspace ID authenticated through Okta Verify', NULL, true, 20),
('notebooklm', 'google', 'NotebookLM Access', 'Access to Google NotebookLM for AI-powered research', 'https://notebooklm.google.com', true, 21),
('google_colab', 'google', 'Google Colab', 'Access to Google Colab for Python notebooks', 'https://colab.research.google.com', false, 22),
('google_antigravity', 'google', 'Google Antigravity', 'Access to Google Antigravity internal platform', NULL, false, 23),

-- Collaboration Tools
('slack_channel', 'collaboration', 'Slack #ai-academy', 'Joined the #ai-academy Slack channel', NULL, true, 30),
('mural_access', 'collaboration', 'Mural/Miro', 'Access to visual collaboration tools (Mural or Miro)', 'https://mural.co', false, 31),

-- Technical Setup (Advanced)
('python_env', 'technical', 'Python Environment', 'Python 3.10+ with pip or conda package manager', 'https://www.python.org/downloads/', false, 40),
('docker_desktop', 'technical', 'Docker Desktop', 'Docker Desktop installed for containerized development', 'https://www.docker.com/products/docker-desktop/', false, 41),

-- Pre-course Confirmation
('reviewed_materials', 'confirmation', 'Reviewed Pre-course Materials', 'Completed review of pre-course learning materials', NULL, true, 50),
('tested_tools', 'confirmation', 'Tested All Required Tools', 'Successfully tested all required tools are working', NULL, true, 51);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_participant_prerequisites_participant
    ON participant_prerequisites(participant_id);
CREATE INDEX IF NOT EXISTS idx_participant_prerequisites_completed
    ON participant_prerequisites(is_completed);
CREATE INDEX IF NOT EXISTS idx_prerequisite_items_category
    ON prerequisite_items(category);

-- View for prerequisite completion summary per participant
CREATE OR REPLACE VIEW participant_prerequisites_summary AS
SELECT
    p.id as participant_id,
    p.name,
    p.email,
    p.role,
    p.team,
    COUNT(CASE WHEN pp.is_completed THEN 1 END) as completed_count,
    COUNT(CASE WHEN pi.is_required THEN 1 END) as required_total,
    COUNT(CASE WHEN pi.is_required AND pp.is_completed THEN 1 END) as required_completed,
    COUNT(pi.id) as total_items,
    ROUND(
        (COUNT(CASE WHEN pi.is_required AND pp.is_completed THEN 1 END)::NUMERIC /
         NULLIF(COUNT(CASE WHEN pi.is_required THEN 1 END), 0) * 100), 0
    ) as required_completion_pct,
    ROUND(
        (COUNT(CASE WHEN pp.is_completed THEN 1 END)::NUMERIC /
         NULLIF(COUNT(pi.id), 0) * 100), 0
    ) as total_completion_pct
FROM participants p
CROSS JOIN prerequisite_items pi
LEFT JOIN participant_prerequisites pp
    ON pp.participant_id = p.id AND pp.prerequisite_id = pi.id
WHERE p.status = 'approved'
GROUP BY p.id, p.name, p.email, p.role, p.team;

-- View for aggregate stats per prerequisite item
CREATE OR REPLACE VIEW prerequisite_stats AS
SELECT
    pi.id,
    pi.code,
    pi.category,
    pi.name,
    pi.is_required,
    COUNT(DISTINCT p.id) as total_participants,
    COUNT(CASE WHEN pp.is_completed THEN 1 END) as completed_count,
    ROUND(
        (COUNT(CASE WHEN pp.is_completed THEN 1 END)::NUMERIC /
         NULLIF(COUNT(DISTINCT p.id), 0) * 100), 0
    ) as completion_pct
FROM prerequisite_items pi
CROSS JOIN participants p
LEFT JOIN participant_prerequisites pp
    ON pp.participant_id = p.id AND pp.prerequisite_id = pi.id
WHERE p.status = 'approved'
GROUP BY pi.id, pi.code, pi.category, pi.name, pi.is_required
ORDER BY pi.display_order;

-- Enable RLS
ALTER TABLE prerequisite_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_prerequisites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prerequisite_items (read-only for all authenticated)
CREATE POLICY "Anyone can read prerequisite items" ON prerequisite_items
    FOR SELECT USING (true);

-- RLS Policies for participant_prerequisites
CREATE POLICY "Participants can view own prerequisites" ON participant_prerequisites
    FOR SELECT USING (
        participant_id IN (
            SELECT id FROM participants WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Participants can update own prerequisites" ON participant_prerequisites
    FOR ALL USING (
        participant_id IN (
            SELECT id FROM participants WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all prerequisites" ON participant_prerequisites
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM participants
            WHERE auth_user_id = auth.uid() AND is_admin = true
        )
    );

-- Grant permissions
GRANT SELECT ON prerequisite_items TO authenticated;
GRANT SELECT, INSERT, UPDATE ON participant_prerequisites TO authenticated;
GRANT SELECT ON participant_prerequisites_summary TO authenticated;
GRANT SELECT ON prerequisite_stats TO authenticated;
