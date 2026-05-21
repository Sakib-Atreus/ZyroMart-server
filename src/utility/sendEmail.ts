import nodemailer from 'nodemailer';
import config from '../config';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.email_user as string,
    pass: config.email_pass as string,
  },
});

export const sendOtpEmail = async (to: string, otp: string, name: string): Promise<void> => {
  const year = new Date().getFullYear();

  await transporter.sendMail({
    from: `"ZyroMart" <${config.email_user}>`,
    to,
    subject: 'Your ZyroMart Verification Code',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background-color:#f0f2f5;font-family:Arial,Helvetica,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">

                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
                    <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">ZyroMart</h1>
                    <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Email Verification</p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:40px 40px 32px;">
                    <p style="margin:0 0 8px;color:#374151;font-size:16px;">Hi <strong>${name}</strong>,</p>
                    <p style="margin:0 0 28px;color:#6b7280;font-size:14px;line-height:1.6;">
                      Use the verification code below to complete your ZyroMart registration.
                      This code is valid for <strong>10 minutes</strong>.
                    </p>

                    <!-- OTP Box -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="background:#f8f7ff;border:2px dashed #c4b5fd;border-radius:10px;padding:28px 20px;">
                          <span style="font-size:40px;font-weight:800;letter-spacing:16px;color:#4f46e5;font-family:'Courier New',monospace;">${otp}</span>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;line-height:1.6;">
                      If you did not create an account on ZyroMart, you can safely ignore this email.
                      Never share this code with anyone.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6;">
                    <p style="margin:0;color:#d1d5db;font-size:12px;">&copy; ${year} ZyroMart. All rights reserved.</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
};
