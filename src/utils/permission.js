export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: "dashboard.view",

  // Leads
  LEAD_CREATE: "lead.create",
  LEAD_VIEW: "lead.view",
  LEAD_UPDATE: "lead.update",
  LEAD_DELETE: "lead.delete",
  LEAD_ASSIGN: "lead.assign",
  LEAD_CONVERT: "lead.convert",

  // Contacts
  CONTACT_CREATE: "contact.create",
  CONTACT_VIEW: "contact.view",
  CONTACT_UPDATE: "contact.update",
  CONTACT_DELETE: "contact.delete",

  // Accounts
  ACCOUNT_CREATE: "account.create",
  ACCOUNT_VIEW: "account.view",
  ACCOUNT_UPDATE: "account.update",
  ACCOUNT_DELETE: "account.delete",

  // Deals
  DEAL_CREATE: "deal.create",
  DEAL_VIEW: "deal.view",
  DEAL_UPDATE: "deal.update",
  DEAL_DELETE: "deal.delete",
  DEAL_ASSIGN: "deal.assign",
  DEAL_STAGE_UPDATE: "deal.stage.update",

  // Tasks
  TASK_CREATE: "task.create",
  TASK_VIEW: "task.view",
  TASK_UPDATE: "task.update",
  TASK_DELETE: "task.delete",
  TASK_ASSIGN: "task.assign",

  // Notes
  NOTE_CREATE: "note.create",
  NOTE_VIEW: "note.view",
  NOTE_UPDATE: "note.update",
  NOTE_DELETE: "note.delete",

  // Meetings
  MEETING_CREATE: "meeting.create",
  MEETING_VIEW: "meeting.view",
  MEETING_UPDATE: "meeting.update",
  MEETING_DELETE: "meeting.delete",

  // Notifications
  NOTIFICATION_VIEW: "notification.view",

  // Users / team
  USER_CREATE: "user.create",
  USER_VIEW: "user.view",
  USER_UPDATE: "user.update",
  USER_DELETE: "user.delete",
  USER_MANAGE: "user.manage",

  // Roles
  ROLE_CREATE: "role.create",
  ROLE_VIEW: "role.view",
  ROLE_UPDATE: "role.update",
  ROLE_DELETE: "role.delete",
  ROLE_MANAGE: "role.manage",

  // Reports
  REPORT_VIEW: "report.view",
  REPORT_EXPORT: "report.export",

  // AI
  AI_USE: "ai.use",
};

export const PERMISSION_GROUPS = {
  dashboard: [PERMISSIONS.DASHBOARD_VIEW],

  lead: [
    PERMISSIONS.LEAD_CREATE,
    PERMISSIONS.LEAD_VIEW,
    PERMISSIONS.LEAD_UPDATE,
    PERMISSIONS.LEAD_DELETE,
    PERMISSIONS.LEAD_ASSIGN,
    PERMISSIONS.LEAD_CONVERT,
  ],

  contact: [
    PERMISSIONS.CONTACT_CREATE,
    PERMISSIONS.CONTACT_VIEW,
    PERMISSIONS.CONTACT_UPDATE,
    PERMISSIONS.CONTACT_DELETE,
  ],

  account: [
    PERMISSIONS.ACCOUNT_CREATE,
    PERMISSIONS.ACCOUNT_VIEW,
    PERMISSIONS.ACCOUNT_UPDATE,
    PERMISSIONS.ACCOUNT_DELETE,
  ],

  deal: [
    PERMISSIONS.DEAL_CREATE,
    PERMISSIONS.DEAL_VIEW,
    PERMISSIONS.DEAL_UPDATE,
    PERMISSIONS.DEAL_DELETE,
    PERMISSIONS.DEAL_ASSIGN,
    PERMISSIONS.DEAL_STAGE_UPDATE,
  ],

  task: [
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_VIEW,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.TASK_DELETE,
    PERMISSIONS.TASK_ASSIGN,
  ],

  note: [
    PERMISSIONS.NOTE_CREATE,
    PERMISSIONS.NOTE_VIEW,
    PERMISSIONS.NOTE_UPDATE,
    PERMISSIONS.NOTE_DELETE,
  ],

  meeting: [
    PERMISSIONS.MEETING_CREATE,
    PERMISSIONS.MEETING_VIEW,
    PERMISSIONS.MEETING_UPDATE,
    PERMISSIONS.MEETING_DELETE,
  ],

  notification: [PERMISSIONS.NOTIFICATION_VIEW],

  user: [
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_MANAGE,
  ],

  role: [
    PERMISSIONS.ROLE_CREATE,
    PERMISSIONS.ROLE_VIEW,
    PERMISSIONS.ROLE_UPDATE,
    PERMISSIONS.ROLE_DELETE,
    PERMISSIONS.ROLE_MANAGE,
  ],

  report: [PERMISSIONS.REPORT_VIEW, PERMISSIONS.REPORT_EXPORT],

  ai: [PERMISSIONS.AI_USE],
};
