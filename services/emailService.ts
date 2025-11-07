import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || 'no-reply@afcon.example.com';

let transporter: nodemailer.Transporter | null = null;

if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
} else {
  console.warn('Email service not fully configured. Set SMTP_HOST/PORT/USER/PASS to enable email notifications.');
}

export const sendEmail = async (to: string | string[], subject: string, html: string) => {
  if (!transporter) {
    console.info('sendEmail skipped (no transporter configured).', { to, subject });
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject,
      html
    });
    console.log('Email sent:', info.messageId);
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
