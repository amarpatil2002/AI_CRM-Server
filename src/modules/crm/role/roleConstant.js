import { ACCESS_SCOPE } from "../../../utils/accessScope.js";
import { PERMISSIONS } from "../../../utils/permission.js";

export const ROLE_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

export const MEMBER_STATUS = {
  ACTIVE: "ACTIVE",
  INVITED: "INVITED",
  INACTIVE: "INACTIVE",
};

export const SYSTEM_ROLE_CODES = {
  OWNER: "owner",
  ADMIN: "admin",
  MANAGER: "manager",
  SALES_REP: "sales_rep",
};

export const SYSTEM_ROLE_NAMES = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  SALES_REP: "SALES_REP",
};

export const RESERVED_ROLE_CODES = Object.values(SYSTEM_ROLE_CODES);

export const ROLE_PERMISSION_KEYS = {
  CREATE: PERMISSIONS.ROLE_CREATE,
  READ: PERMISSIONS.ROLE_READ,
  UPDATE: PERMISSIONS.ROLE_UPDATE,
  DELETE: PERMISSIONS.ROLE_DELETE,
};

export const DEFAULT_ACCESS_SCOPE = {
  lead: ACCESS_SCOPE.OWN,
  contact: ACCESS_SCOPE.OWN,
  account: ACCESS_SCOPE.OWN,
  deal: ACCESS_SCOPE.OWN,
  task: ACCESS_SCOPE.OWN,
  note: ACCESS_SCOPE.OWN,
  meeting: ACCESS_SCOPE.OWN,
  user: ACCESS_SCOPE.OWN,
  report: ACCESS_SCOPE.OWN,
};

export const SCOPED_ROLE_MODULES = Object.keys(DEFAULT_ACCESS_SCOPE);
