import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'African Nations League <onboarding@resend.dev>';

let resend: Resend | null = null;

if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY);
  console.log('✅ Resend email service configured');
} else {
  console.warn('⚠️ Email service not configured. Set RESEND_API_KEY to enable email notifications.');
}

export const sendEmail = async (to: string | string[], subject: string, html: string) => {
  if (!resend) {
    console.info('sendEmail skipped (no Resend configured).', { to, subject });
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html
    });
    
    if (error) {
      console.error('Failed to send email:', error);
    } else {
      console.log('✅ Email sent:', data?.id);
    }
  } catch (err) {
    console.error('Failed to send email:', err);
  }
};

export const sendMatchResultEmail = async (
  to: string | string[],
  matchSummary: { home: string; away: string; scoreA: number; scoreB: number; goals: { playerName: string; teamName: string; minute: number }[] },
  tournamentName?: string
) => {
  const subject = `Match result: ${matchSummary.home} ${matchSummary.scoreA} - ${matchSummary.scoreB} ${matchSummary.away}`;

  const goalsHtml = matchSummary.goals.length > 0
    ? `<ul>${matchSummary.goals.map(g => `<li>${g.minute}' - ${g.playerName} (${g.teamName})</li>`).join('')}</ul>`
    : '<p>No goals scored.</p>';

  const html = `
    <p>Dear Federation Representative,</p>
    <p>The match in ${tournamentName ?? 'the tournament'} has completed.</p>
    <p><strong>${matchSummary.home} ${matchSummary.scoreA} - ${matchSummary.scoreB} ${matchSummary.away}</strong></p>
    <p>Goal scorers:</p>
    ${goalsHtml}
    <p>Regards,<br/>African Nations League Simulator</p>
  `;

  await sendEmail(to, subject, html);
};
