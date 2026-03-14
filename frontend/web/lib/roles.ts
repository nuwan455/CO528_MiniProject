import { User } from "@/store/auth";

export function isAdmin(user?: Pick<User, "role"> | null) {
  return user?.role === "ADMIN";
}

export function isAlumni(user?: Pick<User, "role"> | null) {
  return user?.role === "ALUMNI";
}

export function isStudent(user?: Pick<User, "role"> | null) {
  return user?.role === "STUDENT";
}

export function canPostJobs(user?: Pick<User, "role"> | null) {
  return isAdmin(user);
}

export function canApplyJobs(user?: Pick<User, "role"> | null) {
  return Boolean(user) && !isAdmin(user);
}

export function canCreateDepartmentEvents(user?: Pick<User, "role"> | null) {
  return isAdmin(user);
}

export function canAccessAnalytics(user?: Pick<User, "role"> | null) {
  return isAdmin(user);
}

export function canManageUsers(user?: Pick<User, "role"> | null) {
  return isAdmin(user);
}
