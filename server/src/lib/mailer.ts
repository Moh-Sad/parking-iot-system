import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from './logger.js';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
  auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
});

export interface MailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
}

export async function sendMail(msg: MailMessage): Promise<void> {
  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: Array.isArray(msg.to) ? msg.to.join(',') : msg.to,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
      attachments: msg.attachments,
    });
  } catch (err) {
    logger.error({ err, to: msg.to, subject: msg.subject }, 'sendMail failed');
  }
}

export function passwordRecoveryEmail(resetUrl: string): { subject: string; html: string; text: string } {
  return {
    subject: 'Reset your Parking IoT password',
    html: `<p>Click the link below to reset your password. The link expires in 24 hours.</p>
           <p><a href="${resetUrl}">${resetUrl}</a></p>
           <p>If you did not request this, you can ignore the email.</p>`,
    text: `Reset your password: ${resetUrl}`,
  };
}

export function supervisorInviteEmail(setupUrl: string): { subject: string; html: string; text: string } {
  return {
    subject: 'Your Parking IoT supervisor account',
    html: `<p>An admin has created an account for you.</p>
           <p>Complete your profile and set a password here:</p>
           <p><a href="${setupUrl}">${setupUrl}</a></p>`,
    text: `Complete your account: ${setupUrl}`,
  };
}
