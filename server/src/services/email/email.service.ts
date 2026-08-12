import nodemailer from 'nodemailer';
import { config } from '../../config/index.js';

interface SendPasswordResetParams {
  to: string;
  name: string;
  resetUrl: string;
}

const EMAIL_TIMEOUT_MS = 8000; // 8 seconds maximum timeout for SMTP send

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`SMTP email sending timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

const createTransporter = () => {
  if (config.smtp.host && config.smtp.user) {
    return nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
      connectionTimeout: 5000, // 5 seconds connection timeout
      greetingTimeout: 5000,   // 5 seconds greeting timeout
      socketTimeout: 5000,     // 5 seconds socket inactivity timeout
    });
  }
  return null;
};

export const sendPasswordResetEmail = async ({
  to,
  name,
  resetUrl,
}: SendPasswordResetParams): Promise<boolean> => {
  const transporter = createTransporter();

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2563eb; margin-bottom: 16px;">Password Reset Request</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5;">Hello ${name},</p>
      <p style="color: #374151; font-size: 16px; line-height: 1.5;">
        You recently requested to reset your password for your account. Click the button below to reset it:
      </p>
      <div style="margin: 28px 0;">
        <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
        This link will expire in 1 hour. If you did not request a password reset, please ignore this email or contact support.
      </p>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 12px;">
        If the button above doesn't work, copy and paste this URL into your browser:<br/>
        <a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a>
      </p>
    </div>
  `;

  const text = `Hello ${name},\n\nYou requested a password reset. Click the following link to reset your password:\n${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, please ignore this email.`;

  if (!transporter) {
    if (config.env !== 'production') {
      console.log(`[EMAIL DEV LOG] Password reset email for ${to}: ${resetUrl}`);
    }
    return true;
  }

  try {
    await withTimeout(
      transporter.sendMail({
        from: config.smtp.from,
        to,
        subject: 'Reset Your Servexa Account Password',
        text,
        html,
      }),
      EMAIL_TIMEOUT_MS
    );
    return true;
  } catch (error) {
    console.error('[EMAIL ERROR] Failed to send password reset email:', error);
    return false;
  }
};

export const emailService = {
  sendPasswordResetEmail,
};
