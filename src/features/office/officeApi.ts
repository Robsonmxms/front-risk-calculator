import { apiFetch } from "../../lib/api/client";
import { Office, OfficeMember, OfficeStatus } from "./types";

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
