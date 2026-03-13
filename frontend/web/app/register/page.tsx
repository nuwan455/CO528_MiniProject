"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ApiResponse, WebUser } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth";

interface RegisterResponse {
  user: WebUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export default function RegisterPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "STUDENT",
    department: "Computer Science",
    batchYear: new Date().getFullYear() + 1,
    headline: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { data } = await api.post<ApiResponse<RegisterResponse>>("/auth/register", form);
      const { user, tokens } = data.data;
      localStorage.setItem("token", tokens.accessToken);
      localStorage.setItem("refreshToken", tokens.refreshToken);
      login(user, tokens.accessToken, tokens.refreshToken);
      router.push("/feed");
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Unable to create your account.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-primary">DECP.</h1>
          <p className="text-muted-foreground">Department Engagement & Career Platform</p>
        </div>

        <Card className="border-border/50 bg-card/50 shadow-2xl backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Create account</CardTitle>
            <CardDescription>Join the department network</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="name">
                  Full name
                </label>
                <Input id="name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="email">
                  University Email
                </label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} required className="bg-background/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none" htmlFor="role">
                    Role
                  </label>
                  <select
                    id="role"
                    value={form.role}
                    onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="ALUMNI">Alumni</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none" htmlFor="batchYear">
                    Batch year
                  </label>
                  <Input
                    id="batchYear"
                    type="number"
                    value={form.batchYear}
                    onChange={(e) => setForm((prev) => ({ ...prev, batchYear: Number(e.target.value) }))}
                    className="bg-background/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="headline">
                  Headline
                </label>
                <Input id="headline" value={form.headline} onChange={(e) => setForm((prev) => ({ ...prev, headline: e.target.value }))} placeholder="Aspiring software engineer" className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="password">
                  Password
                </label>
                <Input id="password" type="password" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} required className="bg-background/50" />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
