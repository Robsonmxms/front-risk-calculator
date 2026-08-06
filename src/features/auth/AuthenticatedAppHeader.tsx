"use client";

import { ReactNode } from "react";
import {
  AppHeader as AppHeaderView,
  type AppHeaderNavigationItem
} from "../../components/organisms/AppHeader";
import { useAuth } from "./AuthProvider";

export type ActiveRoute =
  | "dashboard"
  | "admin"
  | "office"
  | "clients"
  | "workbench"
  | "analyticsDiagnostics"
  | "compliance"
  | "reportDelivery"
  | "clientPortal";

export function AppHeader({
  title,
  active,
  showAdmin,
  actions
}: {
  title: string;
  active: ActiveRoute;
  showAdmin?: boolean;
  actions?: ReactNode;
}) {
  const { actor, activeOffice, officeMemberships, selectOffice } = useAuth();
  const isClientOffice = activeOffice?.role === "client";
  const canOpenOfficeSettings = actor?.role === "admin" || activeOffice?.role === "office_admin";
  const canOpenCompliance = actor?.role === "admin" || activeOffice?.role === "office_admin";
  const canOpenReportDelivery = Boolean(activeOffice && !isClientOffice);
  const canOpenTeamAreas = Boolean(activeOffice && !isClientOffice);
  const navigationItems: Array<AppHeaderNavigationItem & { visible: boolean }> = [
    { href: "/dashboard", active: active === "dashboard", label: "Painel", visible: true },
    {
      href: "/admin",
      active: active === "admin",
      label: "Administração",
      visible: Boolean(showAdmin)
    },
    {
      href: "/dashboard/workbench",
      active: active === "workbench",
      label: "Mesa",
      visible: canOpenTeamAreas
    },
    {
      href: "/dashboard/analytics-diagnostics",
      active: active === "analyticsDiagnostics",
      label: "Diagnósticos",
      visible: canOpenTeamAreas
    },
    {
      href: "/dashboard/compliance",
      active: active === "compliance",
      label: "Conformidade",
      visible: Boolean(activeOffice && canOpenCompliance)
    },
    {
      href: "/dashboard/report-delivery",
      active: active === "reportDelivery",
      label: "Entregas",
      visible: Boolean(activeOffice && canOpenReportDelivery)
    },
    {
      href: "/dashboard/client-portal",
      active: active === "clientPortal",
      label: "Portal do cliente",
      visible: Boolean(activeOffice)
    },
    {
      href: "/dashboard/clients",
      active: active === "clients",
      label: "Clientes",
      visible: canOpenTeamAreas
    },
    {
      href: activeOffice ? `/dashboard/offices/${activeOffice.officeId}/settings` : "/dashboard",
      active: active === "office",
      label: "Escritório",
      visible: Boolean(activeOffice && canOpenOfficeSettings)
    }
  ];

  return (
    <AppHeaderView
      title={title}
      navigationItems={navigationItems.filter((item) => item.visible)}
      officeOptions={officeMemberships.map((office) => ({
        id: office.officeId,
        name: office.officeName
      }))}
      selectedOfficeId={activeOffice?.officeId}
      selectedOfficeName={activeOffice?.officeName}
      onSelectOffice={selectOffice}
      actions={actions}
    />
  );
}
