import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db, hashPassword, type StoredUser } from "@/db/csocDatabase";
import { UserRole, ROLE_LABELS } from "@/types/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserPlus, Pencil, Trash2, Loader2, Users } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

type FormData = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

const emptyForm: FormData = { name: "", email: "", password: "", role: "analyst" };

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | null>(null);
  const [editingUser, setEditingUser] = useState<StoredUser | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<StoredUser | null>(null);

  const loadUsers = useCallback(async () => {
    const all = await db.users.toArray();
    all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    setUsers(all);
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const openAdd = () => {
    setForm(emptyForm);
    setFormError("");
    setEditingUser(null);
    setDialogMode("add");
  };

  const openEdit = (u: StoredUser) => {
    setForm({ name: u.name, email: u.email, password: "", role: u.role });
    setFormError("");
    setEditingUser(u);
    setDialogMode("edit");
  };

  const closeDialog = () => { setDialogMode(null); setEditingUser(null); };

  const handleSave = async () => {
    const { name, email, password, role } = form;
    if (!name.trim() || !email.trim()) { setFormError("Name and email are required"); return; }
    if (dialogMode === "add" && password.length < 6) { setFormError("Password must be at least 6 characters"); return; }
    if (dialogMode === "edit" && password && password.length < 6) { setFormError("Password must be at least 6 characters"); return; }

    // Check email unique
    const existing = await db.users.where("email").equals(email.trim().toLowerCase()).first();
    if (existing && (!editingUser || existing.id !== editingUser.id)) {
      setFormError("Email already exists");
      return;
    }

    setSaving(true);
    try {
      if (dialogMode === "add") {
        const pw = await hashPassword(password);
        await db.users.add({
          id: crypto.randomUUID(),
          name: name.trim(),
          email: email.trim().toLowerCase(),
          passwordHash: pw,
          role,
          createdAt: new Date().toISOString(),
        });
      } else if (editingUser) {
        const updates: Partial<StoredUser> = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
        };
        if (password) updates.passwordHash = await hashPassword(password);
        await db.users.update(editingUser.id, updates);
      }
      await loadUsers();
      closeDialog();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await db.users.delete(deleteTarget.id);
    await loadUsers();
    setDeleteTarget(null);
  };

  const roleBadgeVariant = (role: UserRole) => {
    if (role === "admin") return "destructive" as const;
    if (role === "manager") return "default" as const;
    return "secondary" as const;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground">{users.length} user{users.length !== 1 ? "s" : ""} registered</p>
        </div>
        <Button onClick={openAdd}>
          <UserPlus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4" /> All Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="font-mono text-sm">{u.email}</TableCell>
                  <TableCell><Badge variant={roleBadgeVariant(u.role)}>{ROLE_LABELS[u.role]}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(u.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(u)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        disabled={u.id === currentUser?.id}
                        onClick={() => setDeleteTarget(u)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogMode !== null} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogMode === "add" ? "Add New User" : "Edit User"}</DialogTitle>
            <DialogDescription>
              {dialogMode === "add" ? "Create a new user account" : "Update user details"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@csoc.local" type="email" />
            </div>
            <div className="space-y-2">
              <Label>Password {dialogMode === "edit" && <span className="text-xs text-muted-foreground">(leave blank to keep current)</span>}</Label>
              <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={dialogMode === "edit" ? "Unchanged" : "Min 6 characters"} type="password" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as UserRole })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="analyst">Analyst</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {dialogMode === "add" ? "Create User" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
