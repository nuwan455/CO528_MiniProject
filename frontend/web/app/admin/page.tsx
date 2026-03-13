"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ShieldAlert, UserX, Trash2, CheckCircle } from "lucide-react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("users");

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
                    {[
                      { name: "John Doe", email: "john@edu.com", role: "Student", status: "Active" },
                      { name: "Jane Smith", email: "jane@edu.com", role: "Alumni", status: "Active" },
                      { name: "Dr. Who", email: "who@edu.com", role: "Faculty", status: "Suspended" },
                    ].map((user, i) => (
                      <tr key={i} className="hover:bg-accent/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{user.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
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
              <CardTitle className="text-lg">Reported Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-start justify-between p-4 rounded-lg border border-border/50 bg-background/50">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold uppercase text-destructive tracking-wider">Spam</span>
                        <span className="text-xs text-muted-foreground">Reported 2 hours ago</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">Post by User123</p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">"Click here to win a free iPhone..."</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 border-border/50">
                        <CheckCircle className="h-4 w-4 mr-1" /> Ignore
                      </Button>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="content" className="mt-6">
          <div className="text-center py-12 text-muted-foreground border border-dashed border-border/50 rounded-xl bg-card/30">
            Content moderation settings and bulk actions will appear here.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
