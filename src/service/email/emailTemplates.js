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

export const organizationInviteTemplate = ({
  name,
  organizationName,
  inviteUrl,
  inviterName,
}) => {
  const subject = `Invitation to join ${organizationName}`;

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; background-color: #f8fafc; padding: 32px 16px; color: #111827;">
      <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
        
        <div style="background: #2563eb; padding: 24px 32px;">
          <h1 style="margin: 0; font-size: 24px; color: #ffffff;">
            ${organizationName}
          </h1>
          <p style="margin: 8px 0 0; color: #dbeafe; font-size: 14px;">
            Organization Invitation
          </p>
        </div>

        <div style="padding: 32px;">
          <p style="margin: 0 0 16px; font-size: 16px;">
            Hi <strong>${name || "there"}</strong>,
          </p>

          <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.7;">
            <strong>${inviterName || "A team member"}</strong> has invited you to join
            <strong>${organizationName}</strong>.
          </p>

          <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7;">
            Click the button below to accept the invitation and set your password.
          </p>

          <div style="margin: 32px 0; text-align: center;">
            <a
              href="${inviteUrl}"
              style="
                display: inline-block;
                background-color: #2563eb;
                color: #ffffff;
                text-decoration: none;
                padding: 14px 24px;
                border-radius: 8px;
                font-size: 15px;
                font-weight: 600;
              "
            >
              Accept Invitation
            </a>
          </div>

          <p style="margin: 0 0 12px; font-size: 14px; color: #374151;">
            If the button above does not work, copy and paste this link into your browser:
          </p>

          <p style="margin: 0 0 24px; font-size: 14px; word-break: break-word; color: #2563eb;">
            ${inviteUrl}
          </p>

          <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.7;">
            This invitation link will expire in <strong>7 days</strong>.  
            If you were not expecting this invitation, you can safely ignore this email.
          </p>
        </div>

        <div style="padding: 20px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 12px; color: #6b7280;">
            This email was sent by ${organizationName}.
          </p>
        </div>
      </div>
    </div>
  `;

  const text = `
Hi ${name || "there"},

${inviterName || "A team member"} has invited you to join ${organizationName}.

Accept your invitation using the link below:
${inviteUrl}

This invitation link will expire in 7 days.

If you were not expecting this invitation, you can ignore this email.
`;

  return {
    subject,
    html,
    text,
  };
};
