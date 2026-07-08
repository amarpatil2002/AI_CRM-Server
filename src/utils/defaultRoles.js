import { ACCESS_SCOPE } from "./accessScope.js";
import {
  PERMISSIONS,
  PERMISSION_GROUPS,
  ALL_PERMISSIONS,
} from "./permission.js";
import {
  SYSTEM_ROLE_CODES,
  SYSTEM_ROLE_NAMES,
} from "../modules/crm/role/roleConstant.js";

const {
  ORGANIZATION,
  USERS,
  ROLES,
  LEADS,
  CONTACTS,
  ACCOUNTS,
  DEALS,
  TASKS,
  NOTES,
  MEETINGS,
  PIPELINES,
  REPORTS,
  NOTIFICATIONS,
  ACTIVITY,
  AI,
} = PERMISSION_GROUPS;

export const DEFAULT_ROLE_DEFINITIONS = {
  [SYSTEM_ROLE_CODES.OWNER]: {
    name: SYSTEM_ROLE_NAMES.OWNER,
    code: SYSTEM_ROLE_CODES.OWNER,
    description: "Full access to the organization and all CRM resources",
    permissions: [...ALL_PERMISSIONS],
    accessScope: {
      lead: ACCESS_SCOPE.ALL,
      contact: ACCESS_SCOPE.ALL,
      account: ACCESS_SCOPE.ALL,
      deal: ACCESS_SCOPE.ALL,
      task: ACCESS_SCOPE.ALL,
      note: ACCESS_SCOPE.ALL,
      meeting: ACCESS_SCOPE.ALL,
      user: ACCESS_SCOPE.ALL,
      report: ACCESS_SCOPE.ALL,
    },
    isSystem: true,
    isDefault: true,
    priority: 100,
  },
};
