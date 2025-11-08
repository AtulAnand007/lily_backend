import {baseTemplate} from "./baseTemplate.js"


export const changePasswordTemplate = (fullName) =>
  baseTemplate({
    title: 'Password Changed Successfully - Lily',
    userName: fullName,
    bodyContent: `
      <p>Hi ${fullName || "there"},</p>
      <p>
        Your password has been changed successfully. 
      </p>
      <p style="margin-top:20px;">
        If this wasn't you, please reset your password immediately.
      </p>
      <p>— Lily Security Team 🌱</p>
    `,
  });

export const changePasswordText = (fullName) => `
Hi ${fullName || "there"},

Your password has been changed successfully. 


If this wasn't you, please reset your password immediately.


— Lily Security Team 🌱<
Support: random@gmail.com
`;
