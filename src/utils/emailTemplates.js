export const forgotPasswordTemplate = ({ name, resetUrl }) => {
  return {
    subject: "Reset your password",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Password Reset Request</h2>
        <p>Hi ${name || "User"},</p>
        <p>We received a request to reset your password.</p>
        <p>
          Click the button below to reset your password:
        </p>
        <p>
          <a 
            href="${resetUrl}" 
            style="
              display:inline-block;
              padding:12px 20px;
              background:#2563eb;
              color:#ffffff;
              text-decoration:none;
              border-radius:6px;
              font-weight:600;
            "
          >
            Reset Password
          </a>
        </p>
        <p>This link will expire in 10 minutes.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  };
};

export const verifyEmailOtpTemplate = ({ name, otp }) => {
  return {
    subject: "Verify your email",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Email Verification</h2>
        <p>Hi ${name || "User"},</p>
        <p>Your email verification code is:</p>

        <div style="margin: 24px 0;">
          <span
            style="
              display: inline-block;
              font-size: 28px;
              letter-spacing: 6px;
              font-weight: 700;
              background: #f3f4f6;
              padding: 12px 18px;
              border-radius: 10px;
            "
          >
            ${otp}
          </span>
        </div>

        <p>This OTP will expire in 10 minutes.</p>
        <p>If you did not create this account, you can ignore this email.</p>
      </div>
    `,
    text: `Your email verification OTP is ${otp}`,
  };
};
