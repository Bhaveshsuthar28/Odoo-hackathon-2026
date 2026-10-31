import nodemailer, { type Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let transporter: Transporter | null = null;

export function getEmailTransporter(): Transporter | null {
  const mailUser = process.env.MAIL_USER;
  const mailPass = process.env.MAIL_PASSWORD;

  if (!mailUser || !mailPass) {
    return null;
  }

  if (!transporter) {
    const host = process.env.MAIL_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.MAIL_PORT || '587', 10);
    const secure = process.env.MAIL_SECURE === 'true' || port === 465;

    if (host.includes('gmail') || mailUser.endsWith('@gmail.com')) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: mailUser,
          pass: mailPass,
        },
      });
    } else {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user: mailUser,
          pass: mailPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
    }
  }

  return transporter;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; simulated?: boolean }> {
  const mailUser = process.env.MAIL_USER;
  const mailPass = process.env.MAIL_PASSWORD;
  const from = process.env.MAIL_FROM || `"SubFlow Support" <${mailUser || 'support@subflow.io'}>`;

  const transport = getEmailTransporter();

  if (!transport) {
    // In development, testing, or environments without explicit production SMTP credentials, safely simulate email delivery
    if (
      process.env.NODE_ENV !== 'production' ||
      process.env.ALLOW_EMAIL_SIMULATION === 'true' ||
      !process.env.NODE_ENV
    ) {
      console.log(`\n📧 [DEV EMAIL SIMULATION]`);
      console.log(`   To: ${options.to}`);
      console.log(`   Subject: ${options.subject}`);
      console.log(`   Text Content: ${options.text || '(HTML email)'}`);
      console.log(`   Notice: Configure MAIL_USER and MAIL_PASSWORD in .env for real Gmail delivery.\n`);
      return { success: true, simulated: true };
    }

    throw new Error('Gmail Email Service is not configured. Please configure MAIL_USER and MAIL_PASSWORD in your environment variables.');
  }

  try {
    const info = await transport.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.subject,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('❌ Failed to deliver email via Gmail SMTP:', error);
    throw new Error(`Failed to deliver email: ${error.message}`);
  }
}

// ============================================================================
// HTML Email Templates with Odoo-inspired SubFlow Design System
// ============================================================================

function baseEmailLayout(content: string, previewText: string = ''): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SubFlow Notification</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F7F7F8;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #252525;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #F7F7F8;
      padding: 40px 16px;
    }
    .container {
      max-width: 540px;
      margin: 0 auto;
      background: #FFFFFF;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #E5E7EB;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #714B67 0%, #55364E 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .logo-text {
      color: #FFFFFF;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .logo-sub {
      color: #E2D7DF;
      font-size: 13px;
      margin-top: 4px;
      font-weight: 500;
    }
    .body-content {
      padding: 36px 32px;
    }
    .otp-card {
      background: #F9F7F9;
      border: 1.5px dashed #714B67;
      border-radius: 10px;
      padding: 24px;
      text-align: center;
      margin: 28px 0;
    }
    .otp-digits {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 10px;
      color: #714B67;
      margin: 8px 0;
    }
    .expiry-note {
      font-size: 13px;
      color: #D97706;
      font-weight: 600;
      margin: 4px 0 0;
    }
    .footer {
      background-color: #FAFAFA;
      padding: 20px 24px;
      border-top: 1px solid #F1F1F3;
      text-align: center;
      font-size: 12px;
      color: #737373;
    }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${previewText}
  </div>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 class="logo-text">SubFlow</h1>
        <div class="logo-sub">Every Subscription. Every Payment. Every Invoice.</div>
      </div>
      <div class="body-content">
        ${content}
      </div>
      <div class="footer">
        <p style="margin: 0 0 8px;">SubFlow SaaS Platform &bull; Automated Security Dispatch</p>
        <p style="margin: 0;">If you did not request this email, please ignore it or contact security support.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export function customerRegistrationOtpTemplate(name: string, otp: string): string {
  const content = `
    <h2 style="font-size: 22px; font-weight: 700; color: #252525; margin-top: 0; margin-bottom: 12px;">Verify your Gmail address</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #4B5563; margin-bottom: 20px;">
      Hello <strong>${name}</strong>, thank you for joining SubFlow! Please use the following 6-digit One-Time Password (OTP) to complete your registration and activate your customer account:
    </p>
    
    <div class="otp-card">
      <div style="font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #737373;">Verification Code</div>
      <div class="otp-digits">${otp}</div>
      <div class="expiry-note">⏱ Valid for 5 minutes only</div>
    </div>

    <p style="font-size: 14px; line-height: 1.5; color: #6B7280;">
      <strong>Security notice:</strong> SubFlow support will never ask you for this OTP code. Never share this code with anyone.
    </p>
  `;
  return baseEmailLayout(content, `Your SubFlow verification code is ${otp}`);
}

export function customerPasswordResetOtpTemplate(name: string, otp: string): string {
  const content = `
    <h2 style="font-size: 22px; font-weight: 700; color: #252525; margin-top: 0; margin-bottom: 12px;">Reset your SubFlow password</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #4B5563; margin-bottom: 20px;">
      Hello <strong>${name}</strong>, we received a request to reset the password for your SubFlow customer account. Use the 6-digit OTP below to proceed:
    </p>
    
    <div class="otp-card">
      <div style="font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #737373;">Password Reset OTP</div>
      <div class="otp-digits">${otp}</div>
      <div class="expiry-note">⏱ Valid for 5 minutes only</div>
    </div>

    <p style="font-size: 14px; line-height: 1.5; color: #6B7280;">
      If you did not initiate this password reset, your account is still secure. You can safely disregard this message.
    </p>
  `;
  return baseEmailLayout(content, `Your password reset code is ${otp}`);
}

export function accountVerificationConfirmationTemplate(name: string): string {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; background-color: #DCFCE7; color: #16A34A; border-radius: 50%; font-size: 28px;">✓</div>
    </div>
    <h2 style="font-size: 22px; font-weight: 700; color: #252525; text-align: center; margin-top: 0; margin-bottom: 12px;">Account Verified Successfully!</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #4B5563; text-align: center; margin-bottom: 24px;">
      Welcome, <strong>${name}</strong>! Your Gmail address has been verified and your SubFlow customer self-service portal account is now active.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.APP_URL || 'http://localhost:3000'}/customer/login" style="background-color: #714B67; color: #FFFFFF; font-weight: 600; font-size: 15px; padding: 12px 28px; text-decoration: none; border-radius: 8px; display: inline-block;">Log in to Customer Portal</a>
    </div>
  `;
  return baseEmailLayout(content, `Your SubFlow account is now verified and active.`);
}

export function passwordChangedConfirmationTemplate(name: string): string {
  const content = `
    <h2 style="font-size: 22px; font-weight: 700; color: #252525; margin-top: 0; margin-bottom: 12px;">Password Changed Successfully</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #4B5563; margin-bottom: 20px;">
      Hello <strong>${name}</strong>, your SubFlow account password was recently changed. You can now use your new password to sign in.
    </p>
    <p style="font-size: 14px; line-height: 1.5; color: #DC2626; background: #FEF2F2; padding: 12px; border-radius: 6px; border: 1px solid #FEE2E2;">
      <strong>Didn't make this change?</strong> If you did not authorize this change, please immediately reset your password or contact our administrative team.
    </p>
  `;
  return baseEmailLayout(content, `Your SubFlow password has been updated.`);
}
