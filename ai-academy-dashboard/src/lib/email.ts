import { Resend } from 'resend';

// ============================================================================
// HTML Escaping for XSS Prevention in Email Templates
// ============================================================================

/**
 * Escapes HTML special characters to prevent XSS attacks in email templates.
 * While most email clients block scripts, some (like Outlook) may render them,
 * and unescaped HTML can break email layout/display.
 */
function escapeHtml(text: string | undefined | null): string {
  if (text === undefined || text === null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Sanitizes URLs to prevent javascript: and data: protocol attacks.
 * Only allows http:, https:, and mailto: protocols.
 */
function sanitizeUrl(url: string | undefined | null): string {
  if (!url) return '#';
  const trimmed = url.trim();
  // Only allow safe protocols
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('mailto:')) {
    return escapeHtml(trimmed);
  }
  // Block javascript:, data:, and other potentially dangerous protocols
  return '#';
}

// Lazy initialization of Resend client
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

// Email configuration
const FROM_EMAIL = process.env.EMAIL_FROM || 'AI Academy <notifications@ai-academy.dev>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Email types
export type EmailType = 'review' | 'achievement' | 'deadline_reminder' | 'intel_drop';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const resend = getResendClient();

  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping email');
    return { success: false, error: 'Email not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// Email Templates

export function getReviewNotificationEmail(params: {
  participantName: string;
  assignmentTitle: string;
  mentorRating: number;
  mentorNotes?: string;
  dashboardUrl?: string;
}) {
  const { participantName, assignmentTitle, mentorRating, mentorNotes, dashboardUrl = `${APP_URL}/my-dashboard` } = params;

  // Escape all dynamic values for XSS prevention
  const safeParticipantName = escapeHtml(participantName);
  const safeAssignmentTitle = escapeHtml(assignmentTitle);
  const safeMentorNotes = escapeHtml(mentorNotes);
  const safeDashboardUrl = sanitizeUrl(dashboardUrl);

  // Ensure rating is within bounds
  const safeRating = Math.min(5, Math.max(0, Math.floor(mentorRating)));
  const stars = '★'.repeat(safeRating) + '☆'.repeat(5 - safeRating);

  return {
    subject: `Your submission has been reviewed: ${safeAssignmentTitle}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Submission Review</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0062FF; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                AI Academy
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
                Hello <strong>${safeParticipantName}</strong>,
              </p>

              <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
                Your submission for <strong>${safeAssignmentTitle}</strong> has been reviewed by a mentor.
              </p>

              <!-- Rating Box -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                  Rating
                </p>
                <p style="margin: 0; font-size: 32px; color: #f59e0b;">
                  ${stars}
                </p>
                <p style="margin: 10px 0 0; color: #374151; font-size: 18px; font-weight: 600;">
                  ${safeRating}/5
                </p>
              </div>

              ${safeMentorNotes ? `
              <!-- Notes -->
              <div style="background-color: #eff6ff; border-left: 4px solid #0062FF; padding: 15px; margin: 20px 0;">
                <p style="margin: 0 0 5px; color: #1e40af; font-size: 14px; font-weight: 600;">
                  Note from mentor:
                </p>
                <p style="margin: 0; color: #374151; font-size: 14px;">
                  ${safeMentorNotes}
                </p>
              </div>
              ` : ''}

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${safeDashboardUrl}" style="display: inline-block; background-color: #0062FF; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  View my dashboard
                </a>
              </div>

              <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px;">
                Thank you for your work and keep up the great pace!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                AI Academy Dashboard
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
}

export function getAchievementNotificationEmail(params: {
  participantName: string;
  achievementName: string;
  achievementDescription?: string;
  achievementIcon: string;
  bonusPoints: number;
  dashboardUrl?: string;
}) {
  const { participantName, achievementName, achievementDescription, achievementIcon, bonusPoints, dashboardUrl = `${APP_URL}/my-dashboard` } = params;

  // Escape all dynamic values for XSS prevention
  const safeParticipantName = escapeHtml(participantName);
  const safeAchievementName = escapeHtml(achievementName);
  const safeAchievementDescription = escapeHtml(achievementDescription);
  const safeAchievementIcon = escapeHtml(achievementIcon);
  const safeBonusPoints = Math.max(0, Math.floor(Number(bonusPoints) || 0));
  const safeDashboardUrl = sanitizeUrl(dashboardUrl);

  return {
    subject: `New achievement unlocked: ${safeAchievementName}!`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Achievement</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                Achievement Unlocked!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
                Congratulations, <strong>${safeParticipantName}</strong>!
              </p>

              <!-- Achievement Badge -->
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 16px; padding: 30px; margin: 20px 0; display: inline-block;">
                <p style="margin: 0; font-size: 64px; line-height: 1;">
                  ${safeAchievementIcon}
                </p>
                <h2 style="margin: 15px 0 5px; color: #92400e; font-size: 24px; font-weight: 700;">
                  ${safeAchievementName}
                </h2>
                ${safeAchievementDescription ? `
                <p style="margin: 0; color: #a16207; font-size: 14px;">
                  ${safeAchievementDescription}
                </p>
                ` : ''}
              </div>

              ${safeBonusPoints > 0 ? `
              <!-- Bonus Points -->
              <div style="background-color: #ecfdf5; border-radius: 8px; padding: 15px; margin: 20px auto; max-width: 200px;">
                <p style="margin: 0; color: #059669; font-size: 14px;">
                  <strong>+${safeBonusPoints} bonus points</strong>
                </p>
              </div>
              ` : ''}

              <p style="margin: 20px 0; color: #374151; font-size: 16px;">
                Keep up the great work and unlock more achievements!
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${safeDashboardUrl}" style="display: inline-block; background-color: #f59e0b; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  View all achievements
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                AI Academy Dashboard
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
}

export function getDeadlineReminderEmail(params: {
  participantName: string;
  assignments: Array<{
    title: string;
    day: number;
    type: string;
    hoursRemaining: number;
  }>;
  dashboardUrl?: string;
}) {
  const { participantName, assignments, dashboardUrl = `${APP_URL}/my-dashboard` } = params;

  // Escape dynamic values for XSS prevention
  const safeParticipantName = escapeHtml(participantName);
  const safeDashboardUrl = sanitizeUrl(dashboardUrl);
  const safeAssignmentCount = Math.max(0, assignments.length);

  const assignmentsList = assignments
    .map(
      (a) => {
        const safeTitle = escapeHtml(a.title);
        const safeDay = Math.max(0, Math.floor(Number(a.day) || 0));
        const safeType = a.type === 'in_class' ? 'In-Class' : 'Homework';
        const safeHours = Math.max(0, Math.floor(Number(a.hoursRemaining) || 0));
        return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <strong>Day ${safeDay}: ${safeTitle}</strong>
          <br>
          <span style="color: #6b7280; font-size: 13px;">${safeType}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: ${safeHours < 24 ? '#dc2626' : '#f59e0b'}; font-weight: 600;">
          ${safeHours < 24 ? `${safeHours}h` : `${Math.round(safeHours / 24)}d`}
        </td>
      </tr>
    `;
      }
    )
    .join('');

  return {
    subject: `Reminder: ${safeAssignmentCount} assignments near deadline`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deadline Reminder</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #dc2626; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                Deadline Reminder
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
                Hello <strong>${safeParticipantName}</strong>,
              </p>

              <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
                You have <strong>${safeAssignmentCount} ${safeAssignmentCount === 1 ? 'assignment' : 'assignments'}</strong> with an approaching deadline:
              </p>

              <!-- Assignments Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin: 20px 0;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px; text-align: left; color: #6b7280; font-size: 12px; text-transform: uppercase;">Assignment</th>
                    <th style="padding: 12px; text-align: right; color: #6b7280; font-size: 12px; text-transform: uppercase;">Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  ${assignmentsList}
                </tbody>
              </table>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${safeDashboardUrl}" style="display: inline-block; background-color: #0062FF; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  View missing assignments
                </a>
              </div>

              <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; text-align: center;">
                Don't forget to submit on time!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                AI Academy Dashboard
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
}

export function getIntelDropNotificationEmail(params: {
  participantName: string;
  intelTitle: string;
  intelClassification: 'INFO' | 'ALERT' | 'URGENT' | 'CLASSIFIED';
  intelPreview?: string;
  intelUrl?: string;
}) {
  const { participantName, intelTitle, intelClassification, intelPreview, intelUrl = `${APP_URL}/intel` } = params;

  // Escape all dynamic values for XSS prevention
  const safeParticipantName = escapeHtml(participantName);
  const safeIntelTitle = escapeHtml(intelTitle);
  const safeIntelPreview = escapeHtml(intelPreview);
  const safeIntelUrl = sanitizeUrl(intelUrl);
  // Only allow known classification values
  const safeClassification = ['INFO', 'ALERT', 'URGENT', 'CLASSIFIED'].includes(intelClassification)
    ? intelClassification
    : 'INFO';

  const classificationColors: Record<string, { bg: string; text: string; border: string }> = {
    INFO: { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
    ALERT: { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
    URGENT: { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
    CLASSIFIED: { bg: '#1f2937', text: '#f3f4f6', border: '#6b7280' },
  };

  const colors = classificationColors[safeClassification];

  return {
    subject: `[${safeClassification}] New Intel Drop: ${safeIntelTitle}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Intel Drop</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Courier New', Courier, monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #111827; border: 1px solid #374151; border-radius: 4px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(90deg, #0062FF 0%, #1e40af 100%); padding: 20px; text-align: center; border-bottom: 3px solid #3b82f6;">
              <p style="margin: 0 0 5px; color: #93c5fd; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">
                OPERATION AI READY EUROPE
              </p>
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600; letter-spacing: 1px;">
                INTEL DROP
              </h1>
            </td>
          </tr>

          <!-- Classification Banner -->
          <tr>
            <td style="background-color: ${colors.bg}; border-left: 4px solid ${colors.border}; padding: 12px 20px;">
              <p style="margin: 0; color: ${colors.text}; font-size: 12px; font-weight: bold; letter-spacing: 1px;">
                CLASSIFICATION: ${safeClassification}
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px; color: #9ca3af; font-size: 14px;">
                AGENT <span style="color: #60a5fa;">${safeParticipantName}</span>,
              </p>

              <p style="margin: 0 0 20px; color: #d1d5db; font-size: 14px;">
                New intelligence has been declassified and is now available in your briefing room.
              </p>

              <!-- Intel Title Box -->
              <div style="background-color: #1f2937; border: 1px solid #374151; border-radius: 4px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0 0 5px; color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
                  SUBJECT
                </p>
                <h2 style="margin: 0; color: #f3f4f6; font-size: 18px; font-weight: 600;">
                  ${safeIntelTitle}
                </h2>
                ${safeIntelPreview ? `
                <p style="margin: 15px 0 0; color: #9ca3af; font-size: 13px; line-height: 1.5;">
                  ${safeIntelPreview}
                </p>
                ` : ''}
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${safeIntelUrl}" style="display: inline-block; background-color: #0062FF; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-size: 14px; font-weight: 600; letter-spacing: 0.5px; border: 1px solid #3b82f6;">
                  ACCESS INTEL
                </a>
              </div>

              <p style="margin: 20px 0 0; color: #6b7280; font-size: 12px; text-align: center;">
                This message is automatically generated. Do not reply.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0a0a0a; padding: 15px 30px; text-align: center; border-top: 1px solid #374151;">
              <p style="margin: 0; color: #4b5563; font-size: 11px; letter-spacing: 1px;">
                AI ACADEMY COMMAND CENTER
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
}
