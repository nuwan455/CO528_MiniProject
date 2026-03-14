"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getApiErrorMessage, validateRegisterForm } from "@/lib/form-validation";
import { ApiResponse, WebUser } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import { useAuthStore } from "@/store/auth";

interface RegisterResponse {
  message: string;
  user: WebUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

function extractRegisterPayload(apiData: ApiResponse<RegisterResponse>['data']) {
  const topLevel = apiData as Partial<RegisterResponse>;
  if (topLevel?.user && topLevel?.tokens) {
    return topLevel as RegisterResponse;
  }

  const nested = (apiData as { data?: Partial<RegisterResponse> })?.data;
  if (nested?.user && nested?.tokens) {
    return nested as RegisterResponse;
  }

  throw new Error('Unexpected registration response format');
}

export default function RegisterPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const { showToast } = useToast();
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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const normalizedForm = {
      ...form,
      name: form.name.trim().replace(/\s+/g, " "),
      email: form.email.trim().toLowerCase(),
      department: form.department.trim(),
      headline: form.headline.trim(),
      password: form.password,
    };
    const nextErrors = validateRegisterForm(normalizedForm);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      showToast({
        title: "Check your registration details",
        description: Object.values(nextErrors)[0],
        variant: "error",
      });
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { data } = await api.post<ApiResponse<RegisterResponse>>("/auth/register", normalizedForm);
      const { user, tokens } = extractRegisterPayload(data.data);
      localStorage.setItem("token", tokens.accessToken);
      localStorage.setItem("refreshToken", tokens.refreshToken);
      login(user, tokens.accessToken, tokens.refreshToken);
      showToast({
        title: "Account created",
        description: "Your DECP account is ready.",
        variant: "success",
      });
      router.push("/feed");
    } catch (err: any) {
      const message = getApiErrorMessage(err, "Unable to create your account.");
      setError(message);
      showToast({
        title: "Registration failed",
        description: message,
        variant: "error",
      });
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
                {fieldErrors.name ? <p className="text-xs text-destructive">{fieldErrors.name}</p> : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="email">
                  University Email
                </label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} required className="bg-background/50" />
                {fieldErrors.email ? <p className="text-xs text-destructive">{fieldErrors.email}</p> : null}
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
                  {fieldErrors.role ? <p className="text-xs text-destructive">{fieldErrors.role}</p> : null}
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
                  {fieldErrors.batchYear ? <p className="text-xs text-destructive">{fieldErrors.batchYear}</p> : null}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="department">
                  Department
                </label>
                <Input id="department" value={form.department} onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))} className="bg-background/50" />
                {fieldErrors.department ? <p className="text-xs text-destructive">{fieldErrors.department}</p> : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="headline">
                  Headline
                </label>
                <Input id="headline" value={form.headline} onChange={(e) => setForm((prev) => ({ ...prev, headline: e.target.value }))} placeholder="Aspiring software engineer" className="bg-background/50" />
                {fieldErrors.headline ? <p className="text-xs text-destructive">{fieldErrors.headline}</p> : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="password">
                  Password
                </label>
                <Input id="password" type="password" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} required className="bg-background/50" />
                {fieldErrors.password ? <p className="text-xs text-destructive">{fieldErrors.password}</p> : null}
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
