import { baseTemplate } from './baseTemplate.js';

export const verifyEmailLinkTemplate = (fullName, verifyLink) =>
    baseTemplate({
        title: 'Verify Your Email - Lily',
        userName: fullName,
        bodyContent: `
      <p>Hi ${userName || "there"},</p>
      <p>
        We received a request to update your email for your Lily account.
        Click the button below to verify the email. This link will expire in 15 minutes.
      </p>
      <p style="text-align: center;">
        <a href="${verifyLink}" 
           style="display:inline-block;background-color:#2ecc71;color:#fff;text-decoration:none;
                  padding:12px 24px;border-radius:6px;font-weight:600;margin-top:20px;">
          Verify Your Email
        </a>
      </p>
      <p>
        If you didn’t request this, you can safely ignore this email — your email will remain unchanged.
      </p>
      <p>Thanks,<br>The Lily Team 🌱</p>
    `,
    });

export const verifyEmailLinkText = (fullName, verifyLink) => `
Hi ${fullName || "there"},

We received a request to reset your email for your Lily account.

Click this link to verify your email. (expires in 15 minutes):

${verifyLink}

If you didn’t request this, ignore this email — your email stays the same.

— The Lily Team 🌱
Support: random@gmail.com
`;