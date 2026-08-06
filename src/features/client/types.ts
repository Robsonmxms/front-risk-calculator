import type { PortfolioListItem } from "../portfolio";

export type ClientStatus = "active" | "inactive" | "archived";
export type ClientOnboardingStatus = "invited" | "onboarding" | "complete" | "paused";
export type HouseholdStatus = "active" | "archived";

export interface Household {
  id: string;
  officeId: string;
  name: string;
  status: HouseholdStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ClientAccountSummary {
  id: string;
  officeId: string;
  name: string;
  portfolioCount: number;
}

export interface ClientSummary {
  id: string;
  officeId: string;
  householdId?: string;
  householdName?: string;
  name: string;
  email: string;
  phone?: string;
  documentLabel?: string;
  status: ClientStatus;
  onboardingStatus: ClientOnboardingStatus;
  advisorUserId?: string;
  advisorName?: string;
  riskProfileDescriptor: string;
  notes?: string;
  accountCount: number;
  portfolioCount: number;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface ClientDetail extends ClientSummary {
  household?: Household;
  accounts: ClientAccountSummary[];
  portfolios: PortfolioListItem[];
}
