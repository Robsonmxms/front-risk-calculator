import type { UserRole } from "../../lib/contracts/auth";

export const roleCopy: Record<
  UserRole,
  { plural: string; singular: string; singularLower: string; description: string }
> = {
  admin: {
    plural: "Administradores",
    singular: "Administrador",
    singularLower: "administrador",
    description: "Responsáveis pela administração global e pela governança de acessos."
  },
  analyst: {
    plural: "Analistas",
    singular: "Analista",
    singularLower: "analista",
    description: "Profissionais com acesso analítico e gestão delegada de usuários."
  },
  user: {
    plural: "Usuários",
    singular: "Usuário",
    singularLower: "usuário",
    description: "Pessoas com acesso aos recursos autorizados da plataforma."
  }
};

export function roleRosterPath(role: UserRole): string {
  return `/dashboard/users/${role === "admin" ? "admins" : role === "analyst" ? "analysts" : "users"}`;
}
