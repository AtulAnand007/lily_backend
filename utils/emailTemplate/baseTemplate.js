// emails/baseTemplate.js

export const baseTemplate = ({ title, userName, bodyContent }) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title || "Lily Email"}</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #f4f7f6;
        font-family: 'Segoe UI', Arial, sans-serif;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background-color: #ffffff;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }
      .header {
        background: linear-gradient(135deg, #2ecc71, #27ae60);
        color: #ffffff;
        text-align: center;
        padding: 40px 20px;
      }
      .header h1 {
        margin: 0;
        font-size: 28px;
        letter-spacing: 0.5px;
      }
      .header p {
        margin-top: 8px;
        font-size: 14px;
        opacity: 0.9;
      }
      .content {
        padding: 30px 25px;
        line-height: 1.6;
        font-size: 16px;
      }
      .footer {
        text-align: center;
        font-size: 13px;
        color: #999999;
        padding: 20px 10px;
        border-top: 1px solid #eeeeee;
        background-color: #fafafa;
      }
      a {
        color: #3efa8dff;
        text-decoration: none;
      }
      @media (prefers-color-scheme: dark) {
        body {
          background-color: #121212;
          color: #e0e0e0;
        }
        .container {
          background-color: #1e1e1e;
        }
        .header {
          background: linear-gradient(135deg, #27ae60, #1f8f4f);
        }
        .footer {
          background-color: #1a1a1a;
          color: #888;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Lily 🌱</h1>
        <p>Beautiful simplicity, secure experience</p>
      </div>
      <div class="content">
        ${bodyContent}
      </div>
      <div class="footer">
        <p>
          Need help? Contact us at 
          <a href="mailto:random@gmail.com">random@gmail.com</a>
        </p>
        <p>&copy; ${new Date().getFullYear()} Lily. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
`;
