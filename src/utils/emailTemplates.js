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

export const verifyEmailTemplate = ({ name, verifyUrl }) => {
  return {
    subject: "Verify your email",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Verify your email</h2>
        <p>Hi ${name || "User"},</p>
        <p>Welcome to CRM. Please verify your email to activate your account.</p>
        <p>
          <a 
            href="${verifyUrl}" 
            style="
              display:inline-block;
              padding:12px 20px;
              background:#16a34a;
              color:#ffffff;
              text-decoration:none;
              border-radius:6px;
              font-weight:600;
            "
          >
            Verify Email
          </a>
        </p>
        <p>If you did not create this account, you can ignore this email.</p>
      </div>
    `,
  };
};
