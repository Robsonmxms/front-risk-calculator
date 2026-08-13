import { apiFetch } from "../../lib/api/client";
import {
  ClientDetail,
  ClientOnboardingStatus,
  ClientStatus,
  ClientSummary,
  Household,
  HouseholdStatus
} from "./types";

export interface ClientFilters {
  search?: string;
  status?: ClientStatus | "";
  advisorUserId?: string;
  householdId?: string;
  onboardingStatus?: ClientOnboardingStatus | "";
}

export async function listClients(officeId: string, filters: ClientFilters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value);
    }
  }
  const query = params.toString();
  return apiFetch<{ clients: ClientSummary[] }>(
    `/offices/${officeId}/clients${query ? `?${query}` : ""}`
  );
}

export async function getClient(clientId: string) {
  return apiFetch<ClientDetail>(`/clients/${clientId}`);
}

export async function createClient(
  officeId: string,
  input: {
    householdId?: string;
    name: string;
    email: string;
    phone?: string;
    documentLabel?: string;
    onboardingStatus?: ClientOnboardingStatus;
    advisorUserId?: string;
    riskProfileDescriptor?: string;
    notes?: string;
  }
) {
  return apiFetch<ClientDetail>(`/offices/${officeId}/clients`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updateClient(
  clientId: string,
  input: Partial<{
    householdId: string;
    name: string;
    email: string;
    phone: string;
    documentLabel: string;
    status: ClientStatus;
    onboardingStatus: ClientOnboardingStatus;
    advisorUserId: string;
    riskProfileDescriptor: string;
    notes: string;
  }>
) {
  return apiFetch<ClientDetail>(`/clients/${clientId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function listHouseholds(officeId: string) {
  return apiFetch<{ households: Household[] }>(`/offices/${officeId}/households`);
}

export async function createHousehold(officeId: string, input: { name: string }) {
  return apiFetch<Household>(`/offices/${officeId}/households`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updateHousehold(
  householdId: string,
  input: Partial<{ name: string; status: HouseholdStatus }>
) {
  return apiFetch<Household>(`/households/${householdId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}
