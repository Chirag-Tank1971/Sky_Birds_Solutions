// Builds the OTP email. Table layout with inline styles so it renders the same in Gmail, Outlook and Apple Mail.
// No images: many clients block them by default, and the code must be readable without them.

const BRAND = "#10251D";
const LEAF = "#6ebd44";
const MINT = "#e6f4dc";
const INK = "#201d1d";
const MUTED = "#5f6b66";
const SUPPORT_EMAIL = "team@skybirdssolution.com";
const ADDRESS = "2nd floor, Green Palladia, 218, opp. Raj World Shopping Center, Palanpur, Surat, Gujarat 395009";

const COPY = {
  register: {
    subject: (otp) => `${otp} is your SkyBirds verification code`,
    heading: "Verify your email",
    intro: "Use the code below to finish creating your Sky Birds Solution account.",
  },
  link: {
    subject: (otp) => `${otp} is your SkyBirds verification code`,
    heading: "Verify your email",
    intro: "Use the code below to add this email address to your Sky Birds Solution account.",
  },
  reset: {
    subject: (otp) => `${otp} is your SkyBirds password reset code`,
    heading: "Reset your password",
    intro: "We received a request to reset the password for your Sky Birds Solution account. Use the code below to continue.",
  },
};

function otpEmail({ otp, minutes, purpose = "register" }) {
  const copy = COPY[purpose] || COPY.register;
  const year = new Date().getFullYear();

  const text = [
    `${copy.heading}`,
    "",
    copy.intro,
    "",
    `Your code: ${otp}`,
    `It expires in ${minutes} minutes. Never share this code with anyone. Sky Birds Solution will never ask for it.`,
    "",
    "If you didn't request this, you can safely ignore this email.",
    "",
    `Need help? ${SUPPORT_EMAIL}`,
    `Sky Birds Solution, ${ADDRESS}`,
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${copy.heading}</title>
</head>
<body style="margin:0;padding:0;background:#f3f5f2;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Your code is ${otp}. It expires in ${minutes} minutes.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f5f2;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e3e8e1;">
        <tr>
          <td style="background:${BRAND};padding:22px 32px;">
            <span style="font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:bold;color:#ffffff;letter-spacing:0.2px;">Sky Birds</span>
            <span style="font-family:Arial,Helvetica,sans-serif;font-size:18px;color:${LEAF};"> Solution</span>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 32px 8px;font-family:Arial,Helvetica,sans-serif;color:${INK};">
            <h1 style="margin:0 0 12px;font-size:22px;line-height:30px;font-weight:bold;color:${INK};">${copy.heading}</h1>
            <p style="margin:0 0 28px;font-size:15px;line-height:24px;color:${MUTED};">${copy.intro}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${MINT};border-radius:12px;">
              <tr>
                <td align="center" style="padding:24px 16px 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:#2e6b2e;">Your verification code</td>
              </tr>
              <tr>
                <td align="center" style="padding:0 16px 24px;font-family:'Courier New',Courier,monospace;font-size:34px;line-height:42px;font-weight:bold;letter-spacing:10px;color:${BRAND};">${otp}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px 32px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:${MUTED};">
            <p style="margin:0 0 12px;">This code expires in <strong style="color:${INK};">${minutes} minutes</strong>. For your security, never share it with anyone &mdash; Sky Birds Solution will never ask you for this code.</p>
            <p style="margin:0;">If you didn't request this, you can safely ignore this email. Your account stays secure.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #e3e8e1;background:#fafbf9;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:19px;color:#8a948f;">
            Need help? Contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color:#2e6b2e;text-decoration:none;font-weight:bold;">${SUPPORT_EMAIL}</a><br>
            Sky Birds Solution, ${ADDRESS}<br>
            &copy; ${year} Sky Birds Solution. This is an automated message.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  return { subject: copy.subject(otp), text, html };
}

module.exports = { otpEmail };
