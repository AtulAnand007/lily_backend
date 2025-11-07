import { baseTemplate } from './baseTemplate';

export const resetPasswordTemplate = (userName, resetLink) =>
  baseTemplate({
    title: 'Reset Your Password - Lily',
    userName,
    bodyContent: `
      <p>Hi ${userName || "there"},</p>
      <p>
        We received a request to reset your password for your Lily account.
        Click the button below to create a new one. This link will expire in 30 minutes.
      </p>
      <p style="text-align: center;">
        <a href="${resetLink}" 
           style="display:inline-block;background-color:#2ecc71;color:#fff;text-decoration:none;
                  padding:12px 24px;border-radius:6px;font-weight:600;margin-top:20px;">
          Reset Your Password
        </a>
      </p>
      <p>
        If you didn’t request this, you can safely ignore this email — your password will remain unchanged.
      </p>
      <p>Thanks,<br>The Lily Team 🌱</p>
    `,
  });

export const resetPasswordText = (userName, resetLink) => `
Hi ${userName || "there"},

We received a request to reset your password for your Lily account.

Use the link below to set a new password (expires in 30 minutes):

${resetLink}

If you didn’t request this, ignore this email — your password stays the same.

— The Lily Team 🌱
Support: random@gmail.com
`;
