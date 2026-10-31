import nodemailer from 'nodemailer';

/**
 * Creates and caches a Nodemailer transport instance.
 * Checks environment variables for SMTP configuration.
 * Falls back to Ethereal dev transport if credentials are not configured.
 */
let cachedTransporter = null;

const getTransporter = async () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;

  // Use configured SMTP credentials if provided and valid
  if (EMAIL_USER && EMAIL_PASS && EMAIL_USER !== 'your_email@example.com') {
    cachedTransporter = nodemailer.createTransport({
      host: EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(EMAIL_PORT || '587', 10),
      secure: EMAIL_PORT === '465',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });
    return cachedTransporter;
  }

  // Development fallback: Create an Ethereal test account
  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('[EmailService] Using Ethereal test transport (dev mode)');
    return cachedTransporter;
  } catch (error) {
    console.warn('[EmailService] Could not initialize Ethereal transport:', error.message);
    // Return a dummy transporter that will not crash
    return nodemailer.createTransport({
      streamTransport: true,
      newline: 'windows',
    });
  }
};

/**
 * Sends password recovery link to user's registered email address.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.resetUrl - Full password reset URL with token
 */
export const sendPasswordResetEmail = async ({ to, resetUrl }) => {
  try {
    const transporter = await getTransporter();

    const mailOptions = {
      from: `"Brightloop Security" <${process.env.EMAIL_FROM || 'security@brightloop.com'}>`,
      to,
      subject: 'Password Reset Request - Brightloop',
      text: `Hello,\n\nYou requested a password reset for your Brightloop account.\n\nPlease visit the following link to choose a new password:\n${resetUrl}\n\nThis link is valid for 1 hour. If you did not request this, please ignore this email.\n\nBest,\nBrightloop Security Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 2px solid #000000; background: #ffffff;">
          <div style="margin-bottom: 20px;">
            <span style="font-size: 20px; font-weight: 800; letter-spacing: -0.03em; color: #111827;">BRIGHT<span style="color: #ff4f00;">LOOP</span></span>
          </div>
          <h2 style="font-size: 22px; color: #111827; margin-bottom: 12px;">Password Reset Request</h2>
          <p style="color: #4b5563; font-size: 15px; line-height: 1.5;">
            We received a request to reset the password for your Brightloop account. Click the button below to set a new password:
          </p>
          <div style="margin: 28px 0;">
            <a href="${resetUrl}" style="background-color: #ff4f00; color: #ffffff; padding: 12px 24px; font-weight: 700; text-decoration: none; border-radius: 9999px; border: 2px solid #000000; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #6b7280; font-size: 13px;">
            This link is time-sensitive and will expire in <strong>60 minutes</strong>. If you did not request a password reset, you can safely ignore this email.
          </p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 11px; font-family: monospace;">
            BRIGHTLOOP SECURITY // SHA-256 RECOVERY PROTOCOL
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[EmailService] Preview email in Ethereal: ${previewUrl}`);
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[EmailService] Direct reset link (dev mode): ${resetUrl}`);
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error('[EmailService] Failed to send email:', error.message);
    // Never let email delivery failure expose internals to the API caller
    return { success: false, error: error.message };
  }
};

