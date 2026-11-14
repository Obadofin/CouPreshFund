const isConfigured = (env = process.env) => {
  if (!env.GOOGLE_SCRIPT_URL || !env.EMAIL_SECRET) {
    return false;
  }

  try {
    return new URL(env.GOOGLE_SCRIPT_URL).protocol === 'https:';
  } catch {
    return false;
  }
};

const sendVerificationEmail = async (email, code) => {
  if (!isConfigured()) {
    throw new Error('GOOGLE_SCRIPT_URL and EMAIL_SECRET must be configured');
  }

  const response = await fetch(process.env.GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: process.env.EMAIL_SECRET,
      to: email,
      subject: 'Verify your CouPreshFund email',
      text: `Your CouPreshFund verification code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your CouPreshFund verification code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p><p>This code expires in 10 minutes. If you did not create an account, you can ignore this email.</p>`,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Google Apps Script email request failed with HTTP ${response.status}`);
  }

  const responseText = await response.text();
  let result;
  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error('Google Apps Script returned an invalid email response');
  }

  if (!result || result.success !== true || result.error) {
    throw new Error('Google Apps Script reported email delivery failure');
  }
};

module.exports = {
  isConfigured,
  sendVerificationEmail,
};
