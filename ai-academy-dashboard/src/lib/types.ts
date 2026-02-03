// Database types based on supabase-schema.sql

export type RoleType = 'FDE' | 'AI-SE' | 'AI-PM' | 'AI-DA' | 'AI-DS' | 'AI-SEC' | 'AI-FE';

export type TeamType = 'Alpha' | 'Beta' | 'Gamma' | 'Delta' | 'Epsilon' | 'Zeta' | 'Eta' | 'Theta';

export type StreamType = 'Tech' | 'Business';

export type AssignmentType = 'in_class' | 'homework';

export type SubmissionStatus = 'submitted' | 'reviewed' | 'needs_revision' | 'approved';

export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface Participant {
  id: string;
  github_username: string | null;  // Optional - can connect GitHub later
  name: string;
  nickname: string;  // Display name for collaboration
  email: string;
  role: RoleType | null;  // NULL = not yet assigned, user chooses later
  team: TeamType | null;  // NULL = not yet joined a team
  stream: StreamType | null;  // NULL = not yet selected
  avatar_url: string | null;
  repo_url: string | null;
  auth_user_id: string | null;  // Link to Supabase auth user
  status: UserStatus;
  is_admin: boolean;
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Assignment {
  id: string;
  day: number;
  type: AssignmentType;
  title: string;
  description: string | null;
  situation: string | null;
  target_roles: string[] | null; // NULL = common, array = role-specific
  max_points: number;
  due_at: string | null;
  folder_name: string;
  week: number;
  created_at: string;
}

export interface Submission {
  id: string;
  participant_id: string;
  assignment_id: string;
  commit_sha: string;
  commit_message: string | null;
  commit_url: string | null;
  readme_content: string | null;
  self_rating: number | null;
  mentor_rating: number | null;
  mentor_notes: string | null;
  mentor_id: string | null;
  points_earned: number;
  bonus_points: number;
  status: SubmissionStatus;
  submitted_at: string;
  reviewed_at: string | null;
}

export interface LeaderboardEntry {
  participant_id: string;
  total_points: number;
  total_submissions: number;
  on_time_submissions: number;
  avg_self_rating: number | null;
  avg_mentor_rating: number | null;
  current_streak: number;
  rank: number;
  updated_at: string;
}

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  points_bonus: number;
}

export interface ParticipantAchievement {
  participant_id: string;
  achievement_id: string;
  earned_at: string;
}

export interface ActivityLog {
  id: string;
  participant_id: string;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

// View types
export interface LeaderboardView {
  rank: number;
  name: string;
  github_username: string;
  role: RoleType;
  team: TeamType;
  stream: StreamType;
  avatar_url: string | null;
  total_points: number;
  total_submissions: number;
  avg_mentor_rating: number | null;
  current_streak: number;
}

export interface ProgressMatrix {
  role: RoleType;
  day: number;
  type: AssignmentType;
  submitted: number;
  total: number;
  completion_pct: number;
}

export interface TeamProgress {
  team: TeamType;
  team_points: number;
  avg_submissions: number;
  avg_rating: number | null;
}

// Extended types for UI
export interface ActivityLogWithParticipant extends ActivityLog {
  name: string | null;
  github_username: string | null;
  avatar_url: string | null;
}

export interface SubmissionWithDetails extends Submission {
  participants: Pick<Participant, 'name' | 'github_username' | 'avatar_url' | 'role' | 'team'> | null;
  assignments: Pick<Assignment, 'title' | 'day' | 'type'> | null;
}

export interface ParticipantWithAchievements extends Participant {
  participant_achievements: (ParticipantAchievement & {
    achievements: Achievement;
  })[];
}

// Achievement icons mapping
export const ACHIEVEMENT_ICONS: Record<string, string> = {
  first_blood: '🩸',
  early_bird: '🐦',
  night_owl: '🦉',
  perfect_day: '⭐',
  streak_3: '🔥',
  streak_5: '💪',
  team_player: '🤝',
  mentor_favorite: '🌟',
  completionist: '🏆',
};

// Role colors for UI
export const ROLE_COLORS: Record<RoleType, string> = {
  'FDE': 'bg-blue-500',
  'AI-SE': 'bg-green-500',
  'AI-PM': 'bg-purple-500',
  'AI-DA': 'bg-orange-500',
  'AI-DS': 'bg-pink-500',
  'AI-SEC': 'bg-red-500',
  'AI-FE': 'bg-cyan-500',
};

// Team colors for UI
export const TEAM_COLORS: Record<TeamType, string> = {
  'Alpha': 'bg-red-500',
  'Beta': 'bg-blue-500',
  'Gamma': 'bg-green-500',
  'Delta': 'bg-yellow-500',
  'Epsilon': 'bg-purple-500',
  'Zeta': 'bg-pink-500',
  'Eta': 'bg-orange-500',
  'Theta': 'bg-cyan-500',
};

// Peer Review types
export type PeerReviewStatus = 'pending' | 'completed' | 'skipped';

export interface PeerReview {
  id: string;
  submission_id: string;
  reviewer_id: string;
  rating: number | null;
  feedback: string | null;
  is_anonymous: boolean;
  status: PeerReviewStatus;
  bonus_points_earned: number;
  assigned_at: string;
  completed_at: string | null;
}

export interface PeerReviewWithDetails extends PeerReview {
  submissions: {
    id: string;
    commit_message: string | null;
    readme_content: string | null;
    commit_url: string | null;
    participants: Pick<Participant, 'name' | 'github_username' | 'avatar_url' | 'role' | 'team'> | null;
    assignments: Pick<Assignment, 'title' | 'day' | 'type'> | null;
  } | null;
}

export interface PeerReviewStats {
  total_reviews_given: number;
  total_reviews_received: number;
  avg_rating_given: number | null;
  avg_rating_received: number | null;
  bonus_points_earned: number;
}

// Comment types
export interface Comment {
  id: string;
  submission_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string | null;
  is_edited: boolean;
}

export interface CommentWithAuthor extends Comment {
  author: Pick<Participant, 'id' | 'name' | 'github_username' | 'avatar_url' | 'role'> | null;
  replies?: CommentWithAuthor[];
  mentions?: string[];
}

// ============================================================================
// OPERATION AI READY EUROPE - Mission System Types
// ============================================================================

export type ClearanceLevel = 'TRAINEE' | 'FIELD_TRAINEE' | 'FIELD_READY' | 'SPECIALIST';

export type ClientUrgency = 'low' | 'medium' | 'high' | 'critical';

export interface PilotClient {
  id: number;
  name: string;
  codename: string | null;
  sector: string;
  country: string;
  city: string;
  employees: number | null;
  situation: string | null;
  pain_points: string[] | null;
  ai_act_concern: string | null;
  stakeholder_name: string | null;
  stakeholder_title: string | null;
  urgency: ClientUrgency | null;
  icon: string | null;
  color: string | null;
  created_at: string;
}

export interface TaskForce {
  id: number;
  name: string;
  display_name: string;
  client_id: number | null;
  starting_size: number;
  current_size: number;
  overall_readiness: number | null;
  created_at: string;
}

export interface TaskForceMember {
  id: string;
  task_force_id: number;
  participant_id: string;
  is_team_lead: boolean;
  joined_at: string;
}

export interface MissionDay {
  id: number;
  day: number;
  week: number;
  act: number;
  title: string;
  codename: string | null;
  subtitle: string | null;
  briefing_content: string | null;
  resources_content: string | null;
  tech_skills_focus: string[] | null;
  target_roles: string[] | null;
  unlock_date: string | null;
  is_visible: boolean;
  created_at: string;
}

export interface IntelDrop {
  id: number;
  day: number;
  trigger_time: string | null;
  title: string;
  classification: string;
  content: string;
  affected_task_forces: string[] | null;
  is_released: boolean;
  released_at: string | null;
  notification_sent: boolean;
  created_at: string;
}

export interface ParticipantMastery {
  id: string;
  participant_id: string;
  clearance: ClearanceLevel;
  mastery_level: number;
  days_completed: number;
  artifacts_submitted: number;
  ai_tutor_sessions: number;
  peer_assists_given: number;
  week1_checkpoint_passed: boolean;
  week2_checkpoint_passed: boolean;
  week4_checkpoint_passed: boolean;
  week5_checkpoint_passed: boolean;
  updated_at: string;
}

export interface RecognitionType {
  id: number;
  code: string;
  name: string;
  icon: string;
  description: string;
  created_at: string;
}

export interface ParticipantRecognition {
  id: string;
  participant_id: string;
  recognition_type_id: number;
  context: string | null;
  earned_at: string;
}

export interface LiveSession {
  id: string;
  instructor_id: string | null;
  mission_day_id: number | null;
  current_step: number;
  current_section: string;
  started_at: string;
  ended_at: string | null;
  is_active: boolean;
  join_code: string | null;
  created_at: string;
}

// View types for mission system
export interface MissionProgressView {
  participant_id: string;
  github_username: string;
  name: string;
  role: RoleType;
  task_force: string | null;
  client_name: string | null;
  clearance: ClearanceLevel | null;
  mastery_level: number | null;
  days_completed: number | null;
  artifacts_submitted: number | null;
  recognitions_earned: number;
}

export interface TaskForceReadinessView {
  task_force_id: number;
  task_force_name: string;
  display_name: string;
  client_name: string | null;
  client_urgency: ClientUrgency | null;
  member_count: number;
  specialists: number;
  field_ready: number;
  field_trainees: number;
  trainees: number;
  overall_readiness_pct: number | null;
}

// Extended types with relations
export interface TaskForceWithClient extends TaskForce {
  pilot_clients: PilotClient | null;
}

export interface ParticipantWithMastery extends Participant {
  participant_mastery: ParticipantMastery | null;
  task_force_members: (TaskForceMember & { task_forces: TaskForce | null })[] | null;
}

export interface MissionDayWithProgress extends MissionDay {
  is_completed: boolean;
  is_current: boolean;
  is_locked: boolean;
}

// ACT names
export const ACT_NAMES: Record<number, string> = {
  1: 'THE CALL TO ACTION',
  2: 'SKILL BUILDING',
  3: 'TEAM DEPLOYMENT',
  4: 'FINAL PUSH',
};

// ACT week ranges
export const ACT_WEEKS: Record<number, string> = {
  1: 'Week 1',
  2: 'Week 2',
  3: 'Week 4',
  4: 'Week 5',
};

// Clearance level colors
export const CLEARANCE_COLORS: Record<ClearanceLevel, string> = {
  'TRAINEE': 'bg-gray-500',
  'FIELD_TRAINEE': 'bg-blue-500',
  'FIELD_READY': 'bg-green-500',
  'SPECIALIST': 'bg-amber-500',
};

// Clearance level labels
export const CLEARANCE_LABELS: Record<ClearanceLevel, string> = {
  'TRAINEE': 'Trainee',
  'FIELD_TRAINEE': 'Field Trainee',
  'FIELD_READY': 'Field Ready',
  'SPECIALIST': 'Specialist',
};

// Task force colors
export const TASK_FORCE_COLORS: Record<string, string> = {
  'RHEIN': 'bg-blue-600',
  'LYON': 'bg-purple-600',
  'MILAN': 'bg-emerald-600',
  'AMSTERDAM': 'bg-red-600',
};

// Urgency colors
export const URGENCY_COLORS: Record<ClientUrgency, string> = {
  'low': 'bg-gray-500',
  'medium': 'bg-yellow-500',
  'high': 'bg-orange-500',
  'critical': 'bg-red-500',
};

// ============================================================================
// PREREQUISITES TRACKING
// ============================================================================

export type PrerequisiteCategory = 'development' | 'ai_platforms' | 'google' | 'collaboration' | 'technical' | 'confirmation';

export interface PrerequisiteItem {
  id: number;
  code: string;
  category: PrerequisiteCategory;
  name: string;
  description: string | null;
  help_url: string | null;
  is_required: boolean;
  display_order: number;
  created_at: string;
}

export interface ParticipantPrerequisite {
  id: string;
  participant_id: string;
  prerequisite_id: number;
  is_completed: boolean;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PrerequisiteWithStatus extends PrerequisiteItem {
  is_completed: boolean;
  completed_at: string | null;
  notes: string | null;
}

export interface ParticipantPrerequisitesSummary {
  participant_id: string;
  name: string;
  email: string;
  role: RoleType | null;
  team: TeamType | null;
  completed_count: number;
  required_total: number;
  required_completed: number;
  total_items: number;
  required_completion_pct: number;
  total_completion_pct: number;
}

export interface PrerequisiteStats {
  id: number;
  code: string;
  category: PrerequisiteCategory;
  name: string;
  is_required: boolean;
  total_participants: number;
  completed_count: number;
  completion_pct: number;
}

// Category display names
export const PREREQUISITE_CATEGORY_NAMES: Record<PrerequisiteCategory, string> = {
  'development': 'Development Environment',
  'ai_platforms': 'Enterprise AI Platforms',
  'google': 'Google Workspace',
  'collaboration': 'Collaboration Tools',
  'technical': 'Technical Setup (Optional)',
  'confirmation': 'Pre-course Confirmation',
};

// Category icons
export const PREREQUISITE_CATEGORY_ICONS: Record<PrerequisiteCategory, string> = {
  'development': '💻',
  'ai_platforms': '🤖',
  'google': '🔷',
  'collaboration': '🤝',
  'technical': '⚙️',
  'confirmation': '✅',
};
