"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { AdminReportRecord, AdminUserRecord, ApiResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast-provider";
import { useAuthStore } from "@/store/auth";
import { canManageUsers } from "@/lib/roles";
import { Search, ShieldAlert, UserX, Trash2, CheckCircle } from "lucide-react";

export default function AdminPage() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("users");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [reports, setReports] = useState<AdminReportRecord | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const userCanManage = canManageUsers(user);

  useEffect(() => {
    if (!userCanManage) {
      return;
    }

    Promise.all([
      api.get<ApiResponse<AdminUserRecord[]>>("/admin/users"),
      api.get<ApiResponse<AdminReportRecord>>("/admin/reports"),
    ])
      .then(([usersRes, reportsRes]) => {
        setUsers(usersRes.data.data);
        setReports(reportsRes.data.data);
      })
      .catch(() => undefined);
  }, [userCanManage]);

  if (!userCanManage) {
    return (
      <div className="py-8">
        <Card className="border-border/50 bg-card/80">
          <CardContent className="pt-6">
            <h1 className="text-2xl font-bold text-foreground">Admin Access Required</h1>
            <p className="mt-2 text-muted-foreground">
              User account management, moderation, and department-wide oversight are available only to admin accounts.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredUsers = users.filter((adminUser) =>
    [adminUser.name, adminUser.email, adminUser.role, adminUser.department ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <ShieldAlert className="h-8 w-8 text-primary" />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">Manage users, content, and platform settings.</p>
      </div>

      <Tabs defaultValue="users" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md bg-card/50 border border-border/50">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        <div className="mt-6 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={`Search ${activeTab}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 bg-card/50 border-border/50"
            />
          </div>
          <Button variant="outline">Filter</Button>
        </div>

        <TabsContent value="users" className="mt-6">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-border/50 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredUsers.map((adminUser) => (
                      <tr key={adminUser.id} className="hover:bg-accent/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{adminUser.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{adminUser.email}</td>
                        <td className="px-4 py-3">
                          <select
                            className="rounded-full border border-border/50 bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                            value={adminUser.role}
                            disabled={updatingUserId === adminUser.id}
                            onChange={async (e) => {
                              const nextRole = e.target.value as AdminUserRecord["role"];
                              setUpdatingUserId(adminUser.id);
                              try {
                                await api.patch(`/users/${adminUser.id}/role`, { role: nextRole });
                                setUsers((current) =>
                                  current.map((item) =>
                                    item.id === adminUser.id ? { ...item, role: nextRole } : item,
                                  ),
                                );
                                showToast({
                                  title: "Role updated",
                                  description: `${adminUser.name} is now assigned as ${nextRole.toLowerCase()}.`,
                                  variant: "success",
                                });
                              } catch {
                                showToast({
                                  title: "Role update failed",
                                  description: "Unable to change this user role right now.",
                                  variant: "error",
                                });
                              } finally {
                                setUpdatingUserId(null);
                              }
                            }}
                          >
                            <option value="STUDENT">Student</option>
                            <option value="ALUMNI">Alumni</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">
                            Active
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" className="text-muted-foreground" disabled>
                            <UserX className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Platform Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg border border-border/50 bg-background/50 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Users</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">{reports?.users ?? "-"}</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-background/50 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Role Split</p>
                  <p className="mt-2 text-sm text-foreground">
                    {reports
                      ? `${reports.roleBreakdown.students} students, ${reports.roleBreakdown.alumni} alumni, ${reports.roleBreakdown.admins} admins`
                      : "-"}
                  </p>
                </div>
                <div className="rounded-lg border border-border/50 bg-background/50 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Platform Content</p>
                  <p className="mt-2 text-sm text-foreground">
                    {reports ? `${reports.posts} posts, ${reports.jobs} jobs, ${reports.events} events` : "-"}
                  </p>
                </div>
                <div className="rounded-lg border border-border/50 bg-background/50 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Flagged Items</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">{reports?.flaggedCount ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="mt-6">
          <Card className="border-border/50 bg-card/80">
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-border/50 bg-background/50 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Moderation Scope</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Admins manage roles here, while job publishing and event publishing are role-gated inside their own modules.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>
                    <CheckCircle className="h-4 w-4 mr-1" /> Review Queue
                  </Button>
                  <Button variant="destructive" size="sm" disabled>
                    <Trash2 className="h-4 w-4 mr-1" /> Bulk Remove
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
