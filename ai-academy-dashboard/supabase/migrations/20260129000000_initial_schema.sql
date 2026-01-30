-- Migration: Base AI Academy schema (from supabase-schema.sql)
-- Date: 2026-01-29

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE role_type AS ENUM (
    'FDE', 'AI-SE', 'AI-PM', 'AI-DA', 'AI-DS', 'AI-SEC', 'AI-FE', 'AI-DX'
);
CREATE TYPE team_type AS ENUM (
    'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'
);
CREATE TYPE stream_type AS ENUM ('Tech', 'Business');
CREATE TYPE assignment_type AS ENUM ('in_class', 'homework');
CREATE TYPE submission_status AS ENUM ('submitted', 'reviewed', 'needs_revision', 'approved');

CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role role_type NOT NULL,
    team team_type NOT NULL,
    stream stream_type NOT NULL,
    avatar_url TEXT,
    repo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day INTEGER NOT NULL CHECK (day BETWEEN 1 AND 5),
    type assignment_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    max_points INTEGER DEFAULT 15,
    due_at TIMESTAMPTZ,
    folder_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(day, type)
);

CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    commit_sha TEXT NOT NULL,
    commit_message TEXT,
    commit_url TEXT,
    readme_content TEXT,
    self_rating INTEGER CHECK (self_rating BETWEEN 1 AND 5),
    mentor_rating INTEGER CHECK (mentor_rating BETWEEN 1 AND 5),
    mentor_notes TEXT,
    mentor_id UUID REFERENCES participants(id),
    points_earned INTEGER DEFAULT 0,
    bonus_points INTEGER DEFAULT 0,
    status submission_status DEFAULT 'submitted',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    UNIQUE(participant_id, assignment_id)
);

CREATE TABLE leaderboard (
    participant_id UUID PRIMARY KEY REFERENCES participants(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    total_submissions INTEGER DEFAULT 0,
    on_time_submissions INTEGER DEFAULT 0,
    avg_self_rating DECIMAL(3,2),
    avg_mentor_rating DECIMAL(3,2),
    current_streak INTEGER DEFAULT 0,
    rank INTEGER,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    points_bonus INTEGER DEFAULT 0
);

CREATE TABLE participant_achievements (
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (participant_id, achievement_id)
);

CREATE INDEX idx_submissions_participant ON submissions(participant_id);
CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX idx_leaderboard_rank ON leaderboard(rank);

CREATE OR REPLACE FUNCTION update_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO leaderboard (participant_id, total_points, total_submissions, updated_at)
    SELECT NEW.participant_id, COALESCE(SUM(points_earned + bonus_points), 0), COUNT(*), NOW()
    FROM submissions WHERE participant_id = NEW.participant_id
    ON CONFLICT (participant_id) DO UPDATE SET
        total_points = EXCLUDED.total_points,
        total_submissions = EXCLUDED.total_submissions,
        updated_at = NOW();
    WITH ranked AS (
        SELECT participant_id, ROW_NUMBER() OVER (ORDER BY total_points DESC) as new_rank
        FROM leaderboard
    )
    UPDATE leaderboard SET rank = ranked.new_rank
    FROM ranked WHERE leaderboard.participant_id = ranked.participant_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_leaderboard
AFTER INSERT OR UPDATE ON submissions
FOR EACH ROW EXECUTE FUNCTION update_leaderboard();

CREATE OR REPLACE FUNCTION log_submission_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO activity_log (participant_id, action, details)
    VALUES (NEW.participant_id, 'submission',
        jsonb_build_object('assignment_id', NEW.assignment_id, 'commit_sha', NEW.commit_sha, 'status', NEW.status));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_submission
AFTER INSERT ON submissions
FOR EACH ROW EXECUTE FUNCTION log_submission_activity();

INSERT INTO assignments (day, type, title, folder_name, max_points, description) VALUES
(1, 'in_class', 'Agent Foundations', 'day-01-agent-foundations', 15, 'Vytvor agenta so system promptom a 1 toolom'),
(1, 'homework', 'Agent Enhancement', 'homework/day-01', 15, 'Vylepši agenta - pridaj 5 Q&A'),
(2, 'in_class', 'RAG Basics', 'day-02-rag-basics', 15, 'Mini-RAG s dokumentom a evaluáciou'),
(2, 'homework', 'RAG Optimization', 'homework/day-02', 15, 'Optimalizuj RAG - chunking, queries'),
(3, 'in_class', 'Multi-Agent Collaboration', 'day-03-multi-agent', 15, '2 agenti spolupracujú na úlohe'),
(3, 'homework', 'Agent Orchestration', 'homework/day-03', 15, 'Rozšír orchestráciu'),
(4, 'in_class', 'Team Challenge', 'day-04-team-challenge', 20, 'Tímový prototyp'),
(5, 'in_class', 'MVP Demo', 'day-05-mvp', 25, 'Finálne MVP');

INSERT INTO achievements (code, name, description, icon, points_bonus) VALUES
('first_blood', 'First Blood', 'Prvá submisia v akademii', '🩸', 5),
('early_bird', 'Early Bird', 'Submisia pred 9:00', '🐦', 3),
('night_owl', 'Night Owl', 'Submisia po 22:00', '🦉', 3),
('perfect_day', 'Perfect Day', 'In-class aj homework v jeden deň', '⭐', 5),
('streak_3', 'On Fire', '3 dni v rade so submisiou', '🔥', 10),
('streak_5', 'Unstoppable', '5 dní v rade so submisiou', '💪', 20),
('team_player', 'Team Player', 'Prvý z tímu kto submitne', '🤝', 5),
('mentor_favorite', 'Mentor Favorite', '5/5 rating od mentora', '🌟', 10),
('completionist', 'Completionist', 'Všetky úlohy odovzdané', '🏆', 25);

ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read leaderboard" ON leaderboard FOR SELECT USING (true);
CREATE POLICY "Public read activity" ON activity_log FOR SELECT USING (true);
CREATE POLICY "Public read participants" ON participants FOR SELECT USING (true);
CREATE POLICY "Service insert submissions" ON submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read submissions" ON submissions FOR SELECT USING (true);

CREATE VIEW leaderboard_view AS
SELECT l.rank, p.name, p.github_username, p.role, p.team, p.stream, p.avatar_url,
       l.total_points, l.total_submissions, l.avg_mentor_rating, l.current_streak
FROM leaderboard l JOIN participants p ON l.participant_id = p.id ORDER BY l.rank;

CREATE VIEW progress_matrix AS
SELECT p.role, a.day, a.type, COUNT(s.id) as submitted, COUNT(p.id) as total,
       ROUND(COUNT(s.id)::decimal / NULLIF(COUNT(p.id), 0) * 100, 0) as completion_pct
FROM participants p CROSS JOIN assignments a
LEFT JOIN submissions s ON s.participant_id = p.id AND s.assignment_id = a.id
GROUP BY p.role, a.day, a.type ORDER BY p.role, a.day, a.type;

CREATE VIEW team_progress AS
SELECT p.team, SUM(l.total_points) as team_points, AVG(l.total_submissions) as avg_submissions, AVG(l.avg_mentor_rating) as avg_rating
FROM participants p JOIN leaderboard l ON p.id = l.participant_id GROUP BY p.team ORDER BY team_points DESC;
