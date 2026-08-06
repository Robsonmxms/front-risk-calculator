import type { OfficeMembershipRole } from "../auth";

export type OfficeStatus = "active" | "disabled";
export type PermissionKey =
  | "client.read"
  | "client.manage"
  | "ledger.read"
  | "ledger.write"
  | "analytics.read"
  | "analytics.recompute"
  | "reports.request"
  | "reports.approve"
  | "alerts.manage"
  | "notifications.read"
  | "office.members.manage"
  | "audit.read";
export type AssignmentResourceType = "client" | "household" | "account" | "portfolio";

export interface Office {
  id: string;
  name: string;
  status: OfficeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OfficeMember {
  id: string;
  officeId: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: OfficeMembershipRole;
  createdAt: string;
}

export interface AdvisoryTeamMember extends OfficeMember {
  teamId: string;
}

export interface AdvisoryTeam {
  id: string;
  officeId: string;
  name: string;
  description?: string;
  status: "active" | "archived";
  members: AdvisoryTeamMember[];
  createdAt: string;
  updatedAt: string;
}

export interface AdvisoryAssignment {
  id: string;
  officeId: string;
  resourceType: AssignmentResourceType;
  resourceId: string;
  assigneeUserId?: string;
  teamId?: string;
  permissions: PermissionKey[];
  createdBy: string;
  createdAt: string;
  revokedAt?: string;
}

export interface PermissionEvaluation {
  officeId: string;
  role: OfficeMembershipRole;
  permissions: PermissionKey[];
  assignments: AdvisoryAssignment[];
  matrix: Record<OfficeMembershipRole, PermissionKey[]>;
}
