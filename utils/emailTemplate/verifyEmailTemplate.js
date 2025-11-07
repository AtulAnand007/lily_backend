import { baseTemplate } from './baseTemplate.js';

export const verifyEmailTemplate = (fullName, otp) =>
  baseTemplate({
    title: 'Verify Your Email - Lily',
    userName: fullName,
    bodyContent: `
      <p>Hi ${fullName || "there"},</p>
      <p>
        Thank you for registering with <b>Lily</b>! To complete your signup, please use the verification code below.
        It will expire in <b>10 minutes</b>.
      </p>
      <div style="background-color:#f9f9f9;padding:15px;border-radius:8px;
                  text-align:center;margin-top:10px;font-size:22px;
                  font-weight:bold;letter-spacing:3px;color:#27ae60;">
        ${otp}
      </div>
      <p style="margin-top:20px;">
        Enter this code in the Lily app or website to verify your email.
      </p>
      <p>Welcome to the Lily family 🌱</p>
      <p>— The Lily Team</p>
    `,
  });

export const verifyEmailText = (fullName, otp) => `
Hi ${fullName || "there"},

Thanks for joining Lily!

Your verification code is: ${otp}
It’s valid for 10 minutes.

Enter this code in the Lily app or website to verify your email.

If you didn’t request this, ignore this message.

— The Lily Team 🌱
Support: random@gmail.com
`;
