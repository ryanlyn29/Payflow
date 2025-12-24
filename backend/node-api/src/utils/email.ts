import { logger } from './logger';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {

  logger.info('Email would be sent', {
    to: options.to,
    subject: options.subject,

    preview: options.html.substring(0, 100)
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('\n=== EMAIL (Development Mode) ===');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Body:\n${options.text || options.html}`);
    console.log('================================\n');
  }
}

export function generateVerificationEmail(to: string, token: string, baseUrl: string): EmailOptions {
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
  
  return {
    to,
    subject: 'Verify your PaySignal account',
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb;">PaySignal Enterprise Console</h1>
            <p>Thank you for signing up. Please verify your email address by clicking the link below:</p>
            <p style="margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; display: inline-block;">
                Verify Email Address
              </a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
            <p style="margin-top: 30px; font-size: 12px; color: #999;">
              This link will expire in 24 hours. If you didn't create an account, please ignore this email.
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
PaySignal Enterprise Console

Thank you for signing up. Please verify your email address by visiting:

${verificationUrl}

This link will expire in 24 hours. If you didn't create an account, please ignore this email.
    `.trim()
  };
}

export function generatePasswordResetEmail(to: string, token: string, baseUrl: string): EmailOptions {
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  
  return {
    to,
    subject: 'Reset your PaySignal password',
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb;">PaySignal Enterprise Console</h1>
            <p>You requested to reset your password. Click the link below to create a new password:</p>
            <p style="margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; display: inline-block;">
                Reset Password
              </a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="color: #666; word-break: break-all;">${resetUrl}</p>
            <p style="margin-top: 30px; font-size: 12px; color: #999;">
              This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
PaySignal Enterprise Console

You requested to reset your password. Visit the link below to create a new password:

${resetUrl}

This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
    `.trim()
  };
}

