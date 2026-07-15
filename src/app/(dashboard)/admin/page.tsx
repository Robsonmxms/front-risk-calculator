"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Navbar,
  NavbarBrand,
  NavbarCollapse,
  NavbarLink,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow
} from "flowbite-react";
import { ProtectedRoute } from "../../../features/auth/ProtectedRoute";
import { useAuth } from "../../../features/auth/AuthProvider";
import { LogoutButton } from "../../../features/auth/LogoutButton";
import { SafeUser } from "../../../features/auth/types";
import { ApiError, apiFetch } from "../../../lib/api/client";

export default function AdminPage() {
  const { actor } = useAuth();
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ users: SafeUser[] }>("/admin/users")
      .then((data) => setUsers(data.users))
      .catch((caught: unknown) => {
        if (caught instanceof ApiError) {
          setError(`${caught.message} (${caught.code})`);
          return;
        }

        setError("Nao foi possivel carregar os usuarios.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute roles={["admin"]}>
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-5 lg:px-6">
        <Navbar fluid rounded className="border border-gray-200 bg-white/95 shadow-sm">
          <NavbarBrand as={Link} href="/dashboard">
            <div>
              <span className="block text-xs font-semibold uppercase text-teal-700">
                Risk Calculator
              </span>
              <span className="block text-lg font-semibold text-stone-900">Admin console</span>
            </div>
          </NavbarBrand>
          <div className="flex items-center gap-3">
            <NavbarCollapse className="hidden md:flex">
              <NavbarLink as={Link} href="/dashboard">
                Dashboard
              </NavbarLink>
              <NavbarLink as={Link} href="/admin" active>
                Admin
              </NavbarLink>
            </NavbarCollapse>
            {actor ? <Button color="light">{actor.role}</Button> : null}
            <LogoutButton />
          </div>
        </Navbar>

        <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900">Usuarios</h1>
            <p className="text-stone-600">Operacao disponivel apenas para admin.</p>
          </div>

          {loading ? (
            <Alert color="info">Buscando o cadastro seguro retornado pelo backend.</Alert>
          ) : error ? (
            <Alert color="failure">{error}</Alert>
          ) : users.length === 0 ? (
            <Alert color="warning">
              O backend nao retornou registros para esta consulta administrativa.
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table hoverable>
                <TableHead>
                  <TableHeadCell>Nome</TableHeadCell>
                  <TableHeadCell>Email</TableHeadCell>
                  <TableHeadCell>Papel</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                </TableHead>
                <TableBody className="divide-y">
                  {users.map((user) => (
                    <TableRow key={user.id} className="bg-white">
                      <TableCell className="font-medium text-stone-900">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>{user.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </main>
    </ProtectedRoute>
  );
}
