// Database types based on supabase-schema.sql

export type RoleType = 'FDE' | 'AI-SE' | 'AI-PM' | 'AI-DA' | 'AI-DS' | 'AI-SEC' | 'AI-FE' | 'AI-DX';

export type TeamType = 'Alpha' | 'Beta' | 'Gamma' | 'Delta' | 'Epsilon' | 'Zeta' | 'Eta' | 'Theta';

export type StreamType = 'Tech' | 'Business';

export type AssignmentType = 'in_class' | 'homework';

export type SubmissionStatus = 'submitted' | 'reviewed' | 'needs_revision' | 'approved';

export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface Participant {
  id: string;
  github_username: string;
  name: string;
  email: string;
  role: RoleType;
  team: TeamType;
  stream: StreamType;
  avatar_url: string | null;
  repo_url: string | null;
  status: UserStatus;
  is_admin: boolean;
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
  max_points: number;
  due_at: string | null;
  folder_name: string;
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
  participants: Pick<Participant, 'name' | 'github_username' | 'avatar_url'> | null;
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
  'AI-DX': 'bg-yellow-500',
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
