import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';

// ============================================================================
// Common Schemas
// ============================================================================

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email too long');

// Sanitize strings to prevent XSS
function sanitizeString(val: string): string {
  const trimmed = val.trim();
  // Use a robust HTML sanitizer to prevent XSS
  // For user-provided text fields we strip HTML tags and attributes
  return sanitizeHtml(trimmed, {
    allowedTags: [],
    allowedAttributes: {},
  });
}

export const sanitizedStringSchema = z.string().transform(sanitizeString);

// ============================================================================
// Registration Schemas
// ============================================================================

// These must match the types in types.ts
export const VALID_ROLES = ['FDE', 'AI-SE', 'AI-PM', 'AI-DA', 'AI-DS', 'AI-SEC', 'AI-FE'] as const;
export const VALID_TEAMS = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'] as const;
export const VALID_STREAMS = ['Tech', 'Business'] as const;

// Role, team, stream are NOT auto-assigned during registration
// Students choose these later from their profile when they're ready
export const roleSchema = z.enum(VALID_ROLES, {
  message: 'Invalid role type',
}).optional().nullable();

export const teamSchema = z.enum(VALID_TEAMS, {
  message: 'Invalid team',
}).optional().nullable();

export const streamSchema = z.enum(VALID_STREAMS, {
  message: 'Invalid stream',
}).optional().nullable();

// GitHub username schema - optional now
export const githubUsernameSchema = z
  .string()
  .max(39, 'GitHub username too long')
  .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/, 'Invalid GitHub username format')
  .optional()
  .nullable();

// Nickname schema for collaboration
export const nicknameSchema = z
  .string()
  .min(2, 'Nickname must be at least 2 characters')
  .max(30, 'Nickname too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Nickname can only contain letters, numbers, underscores and hyphens')
  .transform(sanitizeString);

export const registerSchema = z.object({
  github_username: githubUsernameSchema,
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .transform(sanitizeString),
  nickname: nicknameSchema,
  email: emailSchema,
  // Role, team, stream are NULL during registration - users set them later from profile
  role: roleSchema,
  team: teamSchema,
  stream: streamSchema,
  avatar_url: z.string().url().optional().nullable(),
  auth_user_id: z.string().uuid().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Sign up schema for email/password registration
export const signUpSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password too long'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .transform(sanitizeString),
  nickname: nicknameSchema,
});

export type SignUpInput = z.infer<typeof signUpSchema>;

// Connect GitHub schema
export const connectGitHubSchema = z.object({
  github_username: z
    .string()
    .min(1, 'GitHub username is required')
    .max(39, 'GitHub username too long')
    .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/, 'Invalid GitHub username format'),
});

export type ConnectGitHubInput = z.infer<typeof connectGitHubSchema>;

// ============================================================================
// Review Schemas
// ============================================================================

export const mentorRatingSchema = z
  .number()
  .int('Rating must be an integer')
  .min(1, 'Rating must be at least 1')
  .max(5, 'Rating must be at most 5');

export const mentorNotesSchema = z
  .string()
  .max(2000, 'Notes too long')
  .transform(sanitizeString)
  .optional()
  .nullable()
  .transform((val) => val || null);

export const reviewSchema = z.object({
  submission_id: uuidSchema,
  mentor_rating: mentorRatingSchema,
  mentor_notes: mentorNotesSchema,
});

export type ReviewInput = z.infer<typeof reviewSchema>;

// ============================================================================
// Bulk Review Schemas
// ============================================================================

const VALID_SUBMISSION_STATUSES = ['pending', 'submitted', 'reviewed', 'late', 'missing'] as const;

export const submissionStatusSchema = z.enum(VALID_SUBMISSION_STATUSES, {
  message: 'Invalid submission status',
});

export const bulkReviewSchema = z
  .object({
    submission_ids: z
      .array(uuidSchema)
      .min(1, 'At least one submission ID is required')
      .max(100, 'Cannot process more than 100 submissions at once'),
    mentor_rating: mentorRatingSchema.optional(),
    mentor_notes: mentorNotesSchema,
    status: submissionStatusSchema.optional(),
  })
  .refine(
    (data) => data.mentor_rating !== undefined || data.status !== undefined,
    {
      message: 'Either mentor_rating or status is required',
    }
  );

export type BulkReviewInput = z.infer<typeof bulkReviewSchema>;

// ============================================================================
// Comment Schemas
// ============================================================================

export const commentCreateSchema = z.object({
  submission_id: uuidSchema,
  content: z
    .string()
    .min(1, 'Comment content cannot be empty')
    .max(2000, 'Comment content too long (max 2000 characters)')
    .transform(sanitizeString),
  parent_id: uuidSchema.optional().nullable(),
});

export type CommentCreateInput = z.infer<typeof commentCreateSchema>;

export const commentUpdateSchema = z.object({
  comment_id: uuidSchema,
  content: z
    .string()
    .min(1, 'Comment content cannot be empty')
    .max(2000, 'Comment content too long (max 2000 characters)')
    .transform(sanitizeString),
});

export type CommentUpdateInput = z.infer<typeof commentUpdateSchema>;

// ============================================================================
// Live Session Schemas
// ============================================================================

export const liveSessionSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title too long')
    .transform(sanitizeString),
  description: z
    .string()
    .max(1000, 'Description too long')
    .transform(sanitizeString)
    .optional()
    .nullable(),
  day: z.number().int().min(1).max(25).optional(),
});

export type LiveSessionInput = z.infer<typeof liveSessionSchema>;

export const joinSessionSchema = z.object({
  code: z
    .string()
    .length(6, 'Join code must be 6 characters')
    .regex(/^[a-z0-9]+$/, 'Invalid join code format'),
});

export type JoinSessionInput = z.infer<typeof joinSessionSchema>;

// ============================================================================
// Intel Drop Notification Schema
// ============================================================================

export const intelNotificationSchema = z.object({
  intelDropId: uuidSchema,
});

export type IntelNotificationInput = z.infer<typeof intelNotificationSchema>;

// ============================================================================
// Validation Helper Functions
// ============================================================================

export interface ValidationResult<T> {
  success: true;
  data: T;
}

export interface ValidationError {
  success: false;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> | ValidationError {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Zod 4.x uses 'issues' instead of 'errors'
  const issues = result.error.issues || [];
  return {
    success: false,
    errors: issues.map((issue) => ({
      field: issue.path.join('.') || 'root',
      message: issue.message,
    })),
  };
}

export function formatValidationErrors(errors: ValidationError['errors']): string {
  return errors.map((e) => `${e.field}: ${e.message}`).join('; ');
}
