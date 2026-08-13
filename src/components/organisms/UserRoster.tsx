import { Alert } from "../atoms/alert";
import { Badge } from "../atoms/badge";
import { Button } from "../atoms/button";
import { Card } from "../atoms/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../atoms/table";

export interface UserRosterItem {
  id: string;
  name: string;
  email: string;
  roleLabel: string;
  statusLabel: string;
  status: "active" | "disabled";
  isSelf: boolean;
}

export function UserRoster({
  users,
  loading,
  error,
  emptyMessage,
  onEdit,
  onRetry
}: {
  users: UserRosterItem[];
  loading: boolean;
  error?: string;
  emptyMessage: string;
  onEdit: (userId: string) => void;
  onRetry: () => void;
}) {
  if (loading) {
    return <Alert variant="info">Carregando cadastros autorizados...</Alert>;
  }
  if (error) {
    return (
      <Alert
        variant="failure"
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <span>{error}</span>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      </Alert>
    );
  }
  if (users.length === 0) {
    return <Alert variant="warning">{emptyMessage}</Alert>;
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-lg border border-border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil global</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium text-stone-900">
                  <div className="flex items-center gap-2">
                    {user.name}
                    {user.isSelf ? <Badge variant="outline">Sua conta</Badge> : null}
                  </div>
                  {user.isSelf ? (
                    <p className="mt-1 max-w-sm text-xs font-normal text-muted-foreground">
                      Você não pode editar a própria conta neste fluxo.
                    </p>
                  ) : null}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.roleLabel}</TableCell>
                <TableCell>
                  <Badge variant={user.status === "active" ? "success" : "failure"}>
                    {user.statusLabel}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {user.isSelf ? (
                    <span className="text-xs text-muted-foreground">Edição indisponível</span>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => onEdit(user.id)}>
                      Editar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 md:hidden" aria-label="Cadastros em formato de cartões">
        {users.map((user) => (
          <Card key={user.id} className="space-y-4 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-stone-900">{user.name}</h2>
                  {user.isSelf ? <Badge variant="outline">Sua conta</Badge> : null}
                </div>
                <p className="break-all text-sm text-muted-foreground">{user.email}</p>
              </div>
              <Badge variant={user.status === "active" ? "success" : "failure"}>
                {user.statusLabel}
              </Badge>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Perfil global</dt>
                <dd className="mt-1 font-medium">{user.roleLabel}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Status</dt>
                <dd className="mt-1 font-medium">{user.statusLabel}</dd>
              </div>
            </dl>
            {user.isSelf ? (
              <p className="text-sm text-muted-foreground">
                Você não pode editar a própria conta neste fluxo.
              </p>
            ) : (
              <Button className="w-full" variant="outline" onClick={() => onEdit(user.id)}>
                Editar cadastro
              </Button>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}
