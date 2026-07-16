import { OfficeMembershipRole } from "../auth/types";

export type OfficeStatus = "active" | "disabled";

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
