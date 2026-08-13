import { apiFetch } from "../../lib/api/client";
import {
  AdvisoryAssignment,
  AdvisoryTeam,
  AssignmentResourceType,
  Office,
  OfficeMember,
  OfficeStatus,
  PermissionEvaluation,
  PermissionKey
} from "./types";

export async function getOffice(officeId: string) {
  return apiFetch<Office>(`/offices/${officeId}`);
}

export async function listOfficeMembers(officeId: string) {
  return apiFetch<{ members: OfficeMember[] }>(`/offices/${officeId}/members`);
}

export async function updateOffice(
  officeId: string,
  input: Partial<{ name: string; status: OfficeStatus }>
) {
  return apiFetch<Office>(`/offices/${officeId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function getMyOfficePermissions(officeId: string) {
  return apiFetch<PermissionEvaluation>(`/me/permissions?officeId=${encodeURIComponent(officeId)}`);
}

export async function listAdvisoryTeams(officeId: string) {
  return apiFetch<{ teams: AdvisoryTeam[] }>(`/offices/${officeId}/teams`);
}

export async function createAdvisoryTeam(
  officeId: string,
  input: { name: string; description?: string; memberUserIds: string[] }
) {
  return apiFetch<AdvisoryTeam>(`/offices/${officeId}/teams`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function listOfficeAssignments(officeId: string) {
  return apiFetch<{ assignments: AdvisoryAssignment[] }>(`/offices/${officeId}/assignments`);
}

export async function createAssignment(input: {
  officeId: string;
  assigneeUserId?: string;
  teamId?: string;
  resourceType: AssignmentResourceType;
  resourceId: string;
  permissions: PermissionKey[];
}) {
  const clientId = input.resourceType === "client" ? input.resourceId : "client_assignment";
  return apiFetch<AdvisoryAssignment>(`/clients/${clientId}/assignments`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function deleteAssignment(assignmentId: string) {
  return apiFetch<AdvisoryAssignment>(`/assignments/${assignmentId}`, {
    method: "DELETE"
  });
}
