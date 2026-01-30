import { Resend } from 'resend';

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
export type EmailType = 'review' | 'achievement' | 'deadline_reminder';

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

  const stars = '★'.repeat(mentorRating) + '☆'.repeat(5 - mentorRating);

  return {
    subject: `Tvoja submisia bola ohodnotená: ${assignmentTitle}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hodnotenie submisie</title>
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
                Ahoj <strong>${participantName}</strong>,
              </p>

              <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
                Tvoja submisia pre úlohu <strong>${assignmentTitle}</strong> bola ohodnotená mentorom.
              </p>

              <!-- Rating Box -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                  Hodnotenie
                </p>
                <p style="margin: 0; font-size: 32px; color: #f59e0b;">
                  ${stars}
                </p>
                <p style="margin: 10px 0 0; color: #374151; font-size: 18px; font-weight: 600;">
                  ${mentorRating}/5
                </p>
              </div>

              ${mentorNotes ? `
              <!-- Notes -->
              <div style="background-color: #eff6ff; border-left: 4px solid #0062FF; padding: 15px; margin: 20px 0;">
                <p style="margin: 0 0 5px; color: #1e40af; font-size: 14px; font-weight: 600;">
                  Poznámka od mentora:
                </p>
                <p style="margin: 0; color: #374151; font-size: 14px;">
                  ${mentorNotes}
                </p>
              </div>
              ` : ''}

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${dashboardUrl}" style="display: inline-block; background-color: #0062FF; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Zobraziť môj dashboard
                </a>
              </div>

              <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px;">
                Ďakujeme za tvoju prácu a pokračuj v skvelom tempe!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                AI Academy Dashboard | Kyndryl
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

  return {
    subject: `Nový achievement odomknutý: ${achievementName}!`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nový Achievement</title>
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
                Gratulujeme, <strong>${participantName}</strong>!
              </p>

              <!-- Achievement Badge -->
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 16px; padding: 30px; margin: 20px 0; display: inline-block;">
                <p style="margin: 0; font-size: 64px; line-height: 1;">
                  ${achievementIcon}
                </p>
                <h2 style="margin: 15px 0 5px; color: #92400e; font-size: 24px; font-weight: 700;">
                  ${achievementName}
                </h2>
                ${achievementDescription ? `
                <p style="margin: 0; color: #a16207; font-size: 14px;">
                  ${achievementDescription}
                </p>
                ` : ''}
              </div>

              ${bonusPoints > 0 ? `
              <!-- Bonus Points -->
              <div style="background-color: #ecfdf5; border-radius: 8px; padding: 15px; margin: 20px auto; max-width: 200px;">
                <p style="margin: 0; color: #059669; font-size: 14px;">
                  <strong>+${bonusPoints} bonus bodov</strong>
                </p>
              </div>
              ` : ''}

              <p style="margin: 20px 0; color: #374151; font-size: 16px;">
                Pokračuj v skvelej práci a odomkni ďalšie achievementy!
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${dashboardUrl}" style="display: inline-block; background-color: #f59e0b; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Zobraziť všetky achievementy
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                AI Academy Dashboard | Kyndryl
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

  const assignmentsList = assignments
    .map(
      (a) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <strong>Day ${a.day}: ${a.title}</strong>
          <br>
          <span style="color: #6b7280; font-size: 13px;">${a.type === 'in_class' ? 'In-Class' : 'Homework'}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: ${a.hoursRemaining < 24 ? '#dc2626' : '#f59e0b'}; font-weight: 600;">
          ${a.hoursRemaining < 24 ? `${a.hoursRemaining}h` : `${Math.round(a.hoursRemaining / 24)}d`}
        </td>
      </tr>
    `
    )
    .join('');

  return {
    subject: `Pripomienka: ${assignments.length} úloh blízko deadline`,
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
                Ahoj <strong>${participantName}</strong>,
              </p>

              <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
                Máš <strong>${assignments.length} ${assignments.length === 1 ? 'úlohu' : assignments.length < 5 ? 'úlohy' : 'úloh'}</strong> s blížiacim sa deadline:
              </p>

              <!-- Assignments Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin: 20px 0;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px; text-align: left; color: #6b7280; font-size: 12px; text-transform: uppercase;">Úloha</th>
                    <th style="padding: 12px; text-align: right; color: #6b7280; font-size: 12px; text-transform: uppercase;">Zostáva</th>
                  </tr>
                </thead>
                <tbody>
                  ${assignmentsList}
                </tbody>
              </table>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${dashboardUrl}" style="display: inline-block; background-color: #0062FF; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Pozrieť si chýbajúce úlohy
                </a>
              </div>

              <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; text-align: center;">
                Nezabudni odovzdať včas!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                AI Academy Dashboard | Kyndryl
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
