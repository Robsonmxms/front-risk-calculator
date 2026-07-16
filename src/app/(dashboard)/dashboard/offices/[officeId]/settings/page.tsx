"use client";

import { FormEvent, useEffect, useState } from "react";
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
  getOffice,
  listOfficeMembers,
  updateOffice
} from "../../../../../../features/office/officeApi";
import { Office, OfficeMember, OfficeStatus } from "../../../../../../features/office/types";
import { ApiError } from "../../../../../../lib/api/client";

export default function OfficeSettingsPage() {
  const { actor, activeOffice } = useAuth();
  const params = useParams<{ officeId: string }>();
  const officeId = params.officeId;
  const [office, setOffice] = useState<Office | null>(null);
  const [members, setMembers] = useState<OfficeMember[]>([]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<OfficeStatus>("active");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    setLoading(true);
    setError(null);
    Promise.all([getOffice(officeId), listOfficeMembers(officeId)])
      .then(([officeData, membersData]) => {
        if (!isActive) {
          return;
        }
        setOffice(officeData);
        setName(officeData.name);
        setStatus(officeData.status);
        setMembers(membersData.members);
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
          <section className="grid gap-4 lg:grid-cols-[380px_1fr]">
            <Card>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-moss">Office</p>
                <h1 className="text-2xl font-semibold text-stone-900">{office.name}</h1>
                <p className="text-sm text-stone-600">Configuração de tenant e status operacional.</p>
              </div>

              <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <Label htmlFor="officeName">Nome</Label>
                  <Input
                    id="officeName"
                    className="mt-2"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="officeStatus">Status</Label>
                  <Select
                    id="officeStatus"
                    className="mt-2"
                    value={status}
                    onChange={(event) => setStatus(event.target.value as OfficeStatus)}
                  >
                    <option value="active">active</option>
                    <option value="disabled">disabled</option>
                  </Select>
                </div>
                {notice ? <Alert variant="info">{notice}</Alert> : null}
                <Button type="submit" disabled={saving}>
                  {saving ? "Salvando..." : "Salvar office"}
                </Button>
              </form>
            </Card>

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
                        <TableCell className="font-medium text-stone-900">{member.userName}</TableCell>
                        <TableCell>{member.userEmail}</TableCell>
                        <TableCell>{member.role}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </section>
        )}
      </main>
    </ProtectedRoute>
  );
}

function getMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message;
  }
  return fallback;
}
