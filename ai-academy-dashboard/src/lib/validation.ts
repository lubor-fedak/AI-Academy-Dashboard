import { z } from 'zod';

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
  return val
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
}

export const sanitizedStringSchema = z.string().transform(sanitizeString);

// ============================================================================
// Registration Schemas
// ============================================================================

const VALID_ROLES = ['FDE', 'AI-SE', 'AI-PM', 'UIUX', 'QA', 'DEVOPS', 'DATA', 'SECURITY'] as const;
const VALID_TEAMS = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot'] as const;
const VALID_STREAMS = ['technical', 'product', 'design', 'management'] as const;

export const roleSchema = z.enum(VALID_ROLES, {
  message: 'Invalid role type',
});

export const teamSchema = z.enum(VALID_TEAMS, {
  message: 'Invalid team',
});

export const streamSchema = z.enum(VALID_STREAMS, {
  message: 'Invalid stream',
});

export const registerSchema = z.object({
  github_username: z
    .string()
    .min(1, 'GitHub username is required')
    .max(39, 'GitHub username too long')
    .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/, 'Invalid GitHub username format'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .transform(sanitizeString),
  email: emailSchema,
  role: roleSchema,
  team: teamSchema,
  stream: streamSchema,
  avatar_url: z.string().url().optional().nullable(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

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
