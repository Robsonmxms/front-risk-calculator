"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AppHeader } from "../../../../../../components/layout/AppHeader";
import { Alert } from "../../../../../../components/ui/alert";
import { Badge } from "../../../../../../components/ui/badge";
import { Button } from "../../../../../../components/ui/button";
import { Card } from "../../../../../../components/ui/card";
import { Label } from "../../../../../../components/ui/form";
import { Input } from "../../../../../../components/ui/input";
import { Select } from "../../../../../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../../../../../../components/ui/table";
import { LogoutButton } from "../../../../../../features/auth/LogoutButton";
import { ProtectedRoute } from "../../../../../../features/auth/ProtectedRoute";
import { useAuth } from "../../../../../../features/auth/AuthProvider";
import {
  createAdvisoryTeam,
  createAssignment,
  deleteAssignment,
  getMyOfficePermissions,
  getOffice,
  listAdvisoryTeams,
  listOfficeAssignments,
  listOfficeMembers,
  updateOffice
} from "../../../../../../features/office/officeApi";
import {
  AdvisoryAssignment,
  AdvisoryTeam,
  AssignmentResourceType,
  Office,
  OfficeMember,
  OfficeStatus,
  PermissionEvaluation,
  PermissionKey
} from "../../../../../../features/office/types";
import { ApiError } from "../../../../../../lib/api/client";

const ASSIGNABLE_PERMISSIONS: PermissionKey[] = [
  "client.read",
  "client.manage",
  "ledger.read",
  "ledger.write",
  "analytics.read",
  "analytics.recompute",
  "reports.request",
  "reports.approve",
  "alerts.manage",
  "notifications.read",
  "audit.read"
];

export default function OfficeSettingsPage() {
  const { actor, activeOffice } = useAuth();
  const params = useParams<{ officeId: string }>();
  const officeId = params.officeId;
  const [office, setOffice] = useState<Office | null>(null);
  const [permissions, setPermissions] = useState<PermissionEvaluation | null>(null);
  const [members, setMembers] = useState<OfficeMember[]>([]);
  const [teams, setTeams] = useState<AdvisoryTeam[]>([]);
  const [assignments, setAssignments] = useState<AdvisoryAssignment[]>([]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<OfficeStatus>("active");
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [teamMemberIds, setTeamMemberIds] = useState<string[]>([]);
  const [assignmentUserId, setAssignmentUserId] = useState("");
  const [assignmentTeamId, setAssignmentTeamId] = useState("");
  const [assignmentResourceType, setAssignmentResourceType] =
    useState<AssignmentResourceType>("portfolio");
  const [assignmentResourceId, setAssignmentResourceId] = useState("prt_main");
  const [assignmentPermission, setAssignmentPermission] =
    useState<PermissionKey>("ledger.write");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canManageMembers = permissions?.permissions.includes("office.members.manage") ?? false;
  const activeAssignments = useMemo(
    () => assignments.filter((assignment) => !assignment.revokedAt),
    [assignments]
  );

  useEffect(() => {
    let isActive = true;

    setLoading(true);
    setError(null);
    Promise.all([getOffice(officeId), getMyOfficePermissions(officeId)])
      .then(async ([officeData, permissionData]) => {
        if (!isActive) {
          return;
        }

        setOffice(officeData);
        setName(officeData.name);
        setStatus(officeData.status);
        setPermissions(permissionData);

        if (!permissionData.permissions.includes("office.members.manage")) {
          setMembers([]);
          setTeams([]);
          setAssignments(permissionData.assignments);
          return;
        }

        const [membersData, teamsData, assignmentsData] = await Promise.all([
          listOfficeMembers(officeId),
          listAdvisoryTeams(officeId),
          listOfficeAssignments(officeId)
        ]);
        if (!isActive) {
          return;
        }

        setMembers(membersData.members);
        setTeams(teamsData.teams);
        setAssignments(assignmentsData.assignments);
      })
      .catch((caught: unknown) => {
        if (isActive) {
          setError(getMessage(caught, "Não foi possível carregar o office."));
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [officeId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const updated = await updateOffice(officeId, { name, status });
      setOffice(updated);
      setNotice("Office atualizado.");
    } catch (caught) {
      setError(getMessage(caught, "Não foi possível atualizar o office."));
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const team = await createAdvisoryTeam(officeId, {
        name: teamName,
        description: teamDescription,
        memberUserIds: teamMemberIds
      });
      setTeams((current) => [...current, team].sort((left, right) => left.name.localeCompare(right.name)));
      setTeamName("");
      setTeamDescription("");
      setTeamMemberIds([]);
      setNotice("Time criado.");
    } catch (caught) {
      setError(getMessage(caught, "Não foi possível criar o time."));
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const assignment = await createAssignment({
        officeId,
        assigneeUserId: assignmentUserId || undefined,
        teamId: assignmentTeamId || undefined,
        resourceType: assignmentResourceType,
        resourceId: assignmentResourceId,
        permissions: [assignmentPermission]
      });
      setAssignments((current) => [assignment, ...current]);
      setNotice("Assignment criado.");
    } catch (caught) {
      setError(getMessage(caught, "Não foi possível criar o assignment."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAssignment(assignmentId: string) {
    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const revoked = await deleteAssignment(assignmentId);
      setAssignments((current) =>
        current.map((assignment) => (assignment.id === revoked.id ? revoked : assignment))
      );
      setNotice("Assignment revogado.");
    } catch (caught) {
      setError(getMessage(caught, "Não foi possível revogar o assignment."));
    } finally {
      setSaving(false);
    }
  }

  function toggleTeamMember(userId: string) {
    setTeamMemberIds((current) =>
      current.includes(userId)
        ? current.filter((entry) => entry !== userId)
        : [...current, userId]
    );
  }

  return (
    <ProtectedRoute roles={["admin", "analyst", "user"]}>
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-5 lg:px-6">
        <AppHeader
          title="Office settings"
          active="office"
          showAdmin={actor?.role === "admin"}
          actions={
            <>
              {activeOffice ? <Badge variant="outline">{activeOffice.role}</Badge> : null}
              <LogoutButton />
            </>
          }
        />

        {loading ? (
          <Alert variant="info">Carregando contexto do office.</Alert>
        ) : error ? (
          <Alert variant="failure">{error}</Alert>
        ) : !office ? (
          <Alert variant="warning">Office não encontrado.</Alert>
        ) : (
          <section className="grid gap-4 xl:grid-cols-[380px_1fr]">
            <Card>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-moss">Office</p>
                <h1 className="text-2xl font-semibold text-stone-900">{office.name}</h1>
                <p className="text-sm text-stone-600">Tenant, papel ativo e permissões carregadas.</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {permissions?.permissions.slice(0, 8).map((permission) => (
                  <Badge key={permission} variant="outline">
                    {permission}
                  </Badge>
                ))}
              </div>

              {!canManageMembers ? (
                <Alert variant="warning" className="mt-5">
                  Ações de equipe indisponíveis para seu papel neste office.
                </Alert>
              ) : null}

              <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <Label htmlFor="officeName">Nome</Label>
                  <Input
                    id="officeName"
                    className="mt-2"
                    value={name}
                    disabled={!canManageMembers}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="officeStatus">Status</Label>
                  <Select
                    id="officeStatus"
                    className="mt-2"
                    value={status}
                    disabled={!canManageMembers}
                    onChange={(event) => setStatus(event.target.value as OfficeStatus)}
                  >
                    <option value="active">active</option>
                    <option value="disabled">disabled</option>
                  </Select>
                </div>
                {notice ? <Alert variant="info">{notice}</Alert> : null}
                <Button type="submit" disabled={saving || !canManageMembers}>
                  {saving ? "Salvando..." : "Salvar office"}
                </Button>
              </form>
            </Card>

            <div className="grid gap-4">
              {canManageMembers ? (
                <>
                  <Card>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase text-moss">Memberships</p>
                        <h2 className="text-xl font-semibold text-stone-900">Equipe do office</h2>
                      </div>
                      <Badge variant="outline">{members.length} membros</Badge>
                    </div>

                    <div className="mt-5 overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>E-mail</TableHead>
                            <TableHead>Papel</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {members.map((member) => (
                            <TableRow key={member.id}>
                              <TableCell className="font-medium text-stone-900">
                                {member.userName}
                              </TableCell>
                              <TableCell>{member.userEmail}</TableCell>
                              <TableCell>{member.role}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>

                  <Card>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase text-moss">Times</p>
                        <h2 className="text-xl font-semibold text-stone-900">Advisory teams</h2>
                      </div>
                      <Badge variant="outline">{teams.length} times</Badge>
                    </div>

                    <form className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_auto]" onSubmit={handleCreateTeam}>
                      <div>
                        <Label htmlFor="teamName">Nome do time</Label>
                        <Input
                          id="teamName"
                          className="mt-2"
                          value={teamName}
                          onChange={(event) => setTeamName(event.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="teamDescription">Descrição</Label>
                        <Input
                          id="teamDescription"
                          className="mt-2"
                          value={teamDescription}
                          onChange={(event) => setTeamDescription(event.target.value)}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button type="submit" disabled={saving || !teamName.trim()}>
                          Criar time
                        </Button>
                      </div>
                      <div className="lg:col-span-3">
                        <p className="mb-2 text-sm font-medium text-stone-800">Membros</p>
                        <div className="flex flex-wrap gap-2">
                          {members.map((member) => (
                            <label
                              key={member.id}
                              className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-stone-700"
                            >
                              <input
                                type="checkbox"
                                checked={teamMemberIds.includes(member.userId)}
                                onChange={() => toggleTeamMember(member.userId)}
                              />
                              {member.userName}
                            </label>
                          ))}
                        </div>
                      </div>
                    </form>

                    <div className="mt-5 overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Membros</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {teams.map((team) => (
                            <TableRow key={team.id}>
                              <TableCell className="font-medium text-stone-900">{team.name}</TableCell>
                              <TableCell>{team.status}</TableCell>
                              <TableCell>{team.members.map((member) => member.userName).join(", ")}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>

                  <Card>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase text-moss">Assignments</p>
                        <h2 className="text-xl font-semibold text-stone-900">Permissões por recurso</h2>
                      </div>
                      <Badge variant="outline">{activeAssignments.length} ativos</Badge>
                    </div>

                    <form className="mt-5 grid gap-4 lg:grid-cols-5" onSubmit={handleCreateAssignment}>
                      <div>
                        <Label htmlFor="assignmentUser">Usuário</Label>
                        <Select
                          id="assignmentUser"
                          className="mt-2"
                          value={assignmentUserId}
                          onChange={(event) => {
                            setAssignmentUserId(event.target.value);
                            setAssignmentTeamId("");
                          }}
                        >
                          <option value="">Nenhum</option>
                          {members.map((member) => (
                            <option key={member.userId} value={member.userId}>
                              {member.userName}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="assignmentTeam">Time</Label>
                        <Select
                          id="assignmentTeam"
                          className="mt-2"
                          value={assignmentTeamId}
                          onChange={(event) => {
                            setAssignmentTeamId(event.target.value);
                            setAssignmentUserId("");
                          }}
                        >
                          <option value="">Nenhum</option>
                          {teams.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="assignmentResourceType">Recurso</Label>
                        <Select
                          id="assignmentResourceType"
                          className="mt-2"
                          value={assignmentResourceType}
                          onChange={(event) =>
                            setAssignmentResourceType(event.target.value as AssignmentResourceType)
                          }
                        >
                          <option value="client">client</option>
                          <option value="household">household</option>
                          <option value="account">account</option>
                          <option value="portfolio">portfolio</option>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="assignmentResourceId">ID do recurso</Label>
                        <Input
                          id="assignmentResourceId"
                          className="mt-2"
                          value={assignmentResourceId}
                          onChange={(event) => setAssignmentResourceId(event.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="assignmentPermission">Permissão</Label>
                        <Select
                          id="assignmentPermission"
                          className="mt-2"
                          value={assignmentPermission}
                          onChange={(event) => setAssignmentPermission(event.target.value as PermissionKey)}
                        >
                          {ASSIGNABLE_PERMISSIONS.map((permission) => (
                            <option key={permission} value={permission}>
                              {permission}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="lg:col-span-5">
                        <Button
                          type="submit"
                          disabled={
                            saving ||
                            !assignmentResourceId.trim() ||
                            (!assignmentUserId && !assignmentTeamId)
                          }
                        >
                          Criar assignment
                        </Button>
                      </div>
                    </form>

                    <div className="mt-5 overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Recurso</TableHead>
                            <TableHead>Alvo</TableHead>
                            <TableHead>Permissões</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Ação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assignments.map((assignment) => (
                            <TableRow key={assignment.id}>
                              <TableCell>
                                {assignment.resourceType}:{assignment.resourceId}
                              </TableCell>
                              <TableCell>
                                {getAssignmentTarget(assignment, members, teams)}
                              </TableCell>
                              <TableCell>{assignment.permissions.join(", ")}</TableCell>
                              <TableCell>{assignment.revokedAt ? "revogado" : "ativo"}</TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="outline"
                                  disabled={saving || Boolean(assignment.revokedAt)}
                                  onClick={() => handleDeleteAssignment(assignment.id)}
                                >
                                  Revogar
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                </>
              ) : null}
            </div>
          </section>
        )}
      </main>
    </ProtectedRoute>
  );
}

function getAssignmentTarget(
  assignment: AdvisoryAssignment,
  members: OfficeMember[],
  teams: AdvisoryTeam[]
) {
  if (assignment.assigneeUserId) {
    return members.find((member) => member.userId === assignment.assigneeUserId)?.userName ?? assignment.assigneeUserId;
  }
  if (assignment.teamId) {
    return teams.find((team) => team.id === assignment.teamId)?.name ?? assignment.teamId;
  }
  return "Sem alvo";
}

function getMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message;
  }
  return fallback;
}
