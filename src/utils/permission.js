export const PERMISSIONS = {
  // Organization / Settings
  ORG_READ: "org:read",
  ORG_UPDATE: "org:update",
  ORG_BILLING_READ: "org.billing:read",
  ORG_BILLING_UPDATE: "org.billing:update",

  // User Management
  USER_CREATE: "user:create",
  USER_READ: "user:read",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",
  USER_INVITE: "user:invite",
  USER_SUSPEND: "user:suspend",

  // Role Management
  ROLE_CREATE: "role:create",
  ROLE_READ: "role:read",
  ROLE_UPDATE: "role:update",
  ROLE_DELETE: "role:delete",

  // Permission viewing
  PERMISSION_READ: "permission:read",

  // Leads
  LEAD_CREATE: "lead:create",
  LEAD_READ: "lead:read",
  LEAD_UPDATE: "lead:update",
  LEAD_DELETE: "lead:delete",
  LEAD_ASSIGN: "lead:assign",
  LEAD_IMPORT: "lead:import",
  LEAD_EXPORT: "lead:export",
  LEAD_CONVERT: "lead:convert",

  // Contacts
  CONTACT_CREATE: "contact:create",
  CONTACT_READ: "contact:read",
  CONTACT_UPDATE: "contact:update",
  CONTACT_DELETE: "contact:delete",
  CONTACT_IMPORT: "contact:import",
  CONTACT_EXPORT: "contact:export",

  // Accounts
  ACCOUNT_CREATE: "account:create",
  ACCOUNT_READ: "account:read",
  ACCOUNT_UPDATE: "account:update",
  ACCOUNT_DELETE: "account:delete",

  // Deals
  DEAL_CREATE: "deal:create",
  DEAL_READ: "deal:read",
  DEAL_UPDATE: "deal:update",
  DEAL_DELETE: "deal:delete",
  DEAL_ASSIGN: "deal:assign",
  DEAL_MOVE_STAGE: "deal:move-stage",
  DEAL_EXPORT: "deal:export",

  // Tasks
  TASK_CREATE: "task:create",
  TASK_READ: "task:read",
  TASK_UPDATE: "task:update",
  TASK_DELETE: "task:delete",
  TASK_ASSIGN: "task:assign",
  TASK_COMPLETE: "task:complete",

  // Notes
  NOTE_CREATE: "note:create",
  NOTE_READ: "note:read",
  NOTE_UPDATE: "note:update",
  NOTE_DELETE: "note:delete",

  // Meetings
  MEETING_CREATE: "meeting:create",
  MEETING_READ: "meeting:read",
  MEETING_UPDATE: "meeting:update",
  MEETING_DELETE: "meeting:delete",

  // Pipelines / stages
  PIPELINE_CREATE: "pipeline:create",
  PIPELINE_READ: "pipeline:read",
  PIPELINE_UPDATE: "pipeline:update",
  PIPELINE_DELETE: "pipeline:delete",

  // Reports / dashboard
  REPORT_READ: "report:read",
  REPORT_EXPORT: "report:export",
  DASHBOARD_READ: "dashboard:read",

  // Notifications
  NOTIFICATION_READ: "notification:read",
  NOTIFICATION_UPDATE: "notification:update",

  // Activity / audit
  ACTIVITY_READ: "activity:read",
  AUDIT_LOG_READ: "audit-log:read",

  // AI features
  AI_EMAIL_GENERATE: "ai.email:generate",
  AI_LEAD_SCORE: "ai.lead-score:generate",
  AI_FORECAST_READ: "ai.forecast:read",
  AI_MEETING_SUMMARY: "ai.meeting-summary:generate",
  AI_SEGMENT_GENERATE: "ai.segment:generate",
};

export const PERMISSION_GROUPS = {
  ORGANIZATION: [
    PERMISSIONS.ORG_READ,
    PERMISSIONS.ORG_UPDATE,
    PERMISSIONS.ORG_BILLING_READ,
    PERMISSIONS.ORG_BILLING_UPDATE,
  ],

  USERS: [
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_INVITE,
    PERMISSIONS.USER_SUSPEND,
  ],

  ROLES: [
    PERMISSIONS.ROLE_CREATE,
    PERMISSIONS.ROLE_READ,
    PERMISSIONS.ROLE_UPDATE,
    PERMISSIONS.ROLE_DELETE,
    PERMISSIONS.PERMISSION_READ,
  ],

  LEADS: [
    PERMISSIONS.LEAD_CREATE,
    PERMISSIONS.LEAD_READ,
    PERMISSIONS.LEAD_UPDATE,
    PERMISSIONS.LEAD_DELETE,
    PERMISSIONS.LEAD_ASSIGN,
    PERMISSIONS.LEAD_IMPORT,
    PERMISSIONS.LEAD_EXPORT,
    PERMISSIONS.LEAD_CONVERT,
  ],

  CONTACTS: [
    PERMISSIONS.CONTACT_CREATE,
    PERMISSIONS.CONTACT_READ,
    PERMISSIONS.CONTACT_UPDATE,
    PERMISSIONS.CONTACT_DELETE,
    PERMISSIONS.CONTACT_IMPORT,
    PERMISSIONS.CONTACT_EXPORT,
  ],

  ACCOUNTS: [
    PERMISSIONS.ACCOUNT_CREATE,
    PERMISSIONS.ACCOUNT_READ,
    PERMISSIONS.ACCOUNT_UPDATE,
    PERMISSIONS.ACCOUNT_DELETE,
  ],

  DEALS: [
    PERMISSIONS.DEAL_CREATE,
    PERMISSIONS.DEAL_READ,
    PERMISSIONS.DEAL_UPDATE,
    PERMISSIONS.DEAL_DELETE,
    PERMISSIONS.DEAL_ASSIGN,
    PERMISSIONS.DEAL_MOVE_STAGE,
    PERMISSIONS.DEAL_EXPORT,
  ],

  TASKS: [
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.TASK_DELETE,
    PERMISSIONS.TASK_ASSIGN,
    PERMISSIONS.TASK_COMPLETE,
  ],

  NOTES: [
    PERMISSIONS.NOTE_CREATE,
    PERMISSIONS.NOTE_READ,
    PERMISSIONS.NOTE_UPDATE,
    PERMISSIONS.NOTE_DELETE,
  ],

  MEETINGS: [
    PERMISSIONS.MEETING_CREATE,
    PERMISSIONS.MEETING_READ,
    PERMISSIONS.MEETING_UPDATE,
    PERMISSIONS.MEETING_DELETE,
  ],

  PIPELINES: [
    PERMISSIONS.PIPELINE_CREATE,
    PERMISSIONS.PIPELINE_READ,
    PERMISSIONS.PIPELINE_UPDATE,
    PERMISSIONS.PIPELINE_DELETE,
  ],

  REPORTS: [
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.DASHBOARD_READ,
  ],

  NOTIFICATIONS: [
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.NOTIFICATION_UPDATE,
  ],

  ACTIVITY: [PERMISSIONS.ACTIVITY_READ, PERMISSIONS.AUDIT_LOG_READ],

  AI: [
    PERMISSIONS.AI_EMAIL_GENERATE,
    PERMISSIONS.AI_LEAD_SCORE,
    PERMISSIONS.AI_FORECAST_READ,
    PERMISSIONS.AI_MEETING_SUMMARY,
    PERMISSIONS.AI_SEGMENT_GENERATE,
  ],
};

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);
