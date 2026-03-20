"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase, GraduationCap } from "lucide-react";
import api from "@/lib/api";
import { getApiErrorMessage, validateLoginForm } from "@/lib/form-validation";
import { ApiResponse, WebUser } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import { useAuthStore } from "@/store/auth";

interface LoginResponse {
  message: string;
  user: WebUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

function extractLoginPayload(apiData: ApiResponse<LoginResponse>['data']) {
  const topLevel = apiData as Partial<LoginResponse>;
  if (topLevel?.user && topLevel?.tokens) {
    return topLevel as LoginResponse;
  }

  const nested = (apiData as { data?: Partial<LoginResponse> })?.data;
  if (nested?.user && nested?.tokens) {
    return nested as LoginResponse;
  }

  throw new Error('Unexpected login response format');
}

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password;
    const nextErrors = validateLoginForm({ email: normalizedEmail, password: normalizedPassword });
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      showToast({
        title: "Check your login details",
        description: Object.values(nextErrors)[0],
        variant: "error",
      });
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { data } = await api.post<ApiResponse<LoginResponse>>("/auth/login", {
        email: normalizedEmail,
        password: normalizedPassword,
      });
      const { user, tokens } = extractLoginPayload(data.data);
      localStorage.setItem("token", tokens.accessToken);
      localStorage.setItem("refreshToken", tokens.refreshToken);
      login(user, tokens.accessToken, tokens.refreshToken);
      showToast({
        title: "Signed in",
        description: "Welcome back to DECP.",
        variant: "success",
      });
      router.push("/feed");
    } catch (err: any) {
      const message = getApiErrorMessage(err, "Unable to sign in with those credentials.");
      setError(message);
      showToast({
        title: "Sign in failed",
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
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/20 via-primary/10 to-card shadow-lg shadow-primary/10">
            <div className="relative">
              <GraduationCap className="h-8 w-8 text-primary" />
              <div className="absolute -bottom-1 -right-2 flex h-6 w-6 items-center justify-center rounded-full border border-primary/20 bg-background shadow-sm">
                <Briefcase className="h-3 w-3 text-primary" />
              </div>
            </div>
          </div>
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-primary">DECP.</h1>
          <p className="text-muted-foreground">Department Engagement & Career Platform</p>
        </div>

        <Card className="border-primary/25 bg-card/70 shadow-2xl shadow-black/30 ring-1 ring-white/6 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="email">
                  Email
                </label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@university.edu" required className="bg-background/50" />
                {fieldErrors.email ? <p className="text-xs text-destructive">{fieldErrors.email}</p> : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="password">
                  Password
                </label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-background/50" />
                {fieldErrors.password ? <p className="text-xs text-destructive">{fieldErrors.password}</p> : null}
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-medium text-primary hover:underline">
                  Create one
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
