export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateLoginForm(input: { email: string; password: string }) {
  const errors: Partial<Record<keyof typeof input, string>> = {};

  if (!input.email.trim()) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(input.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!input.password) {
    errors.password = "Password is required.";
  } else if (input.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  return errors;
}

export function validateRegisterForm(input: {
  name: string;
  email: string;
  role: string;
  department: string;
  batchYear: number;
  headline: string;
  password: string;
}) {
  const errors: Partial<Record<keyof typeof input, string>> = {};

  if (!input.name.trim()) {
    errors.name = "Full name is required.";
  } else if (input.name.trim().length < 3) {
    errors.name = "Full name must be at least 3 characters.";
  }

  if (!input.email.trim()) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(input.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!input.role) {
    errors.role = "Select a role.";
  }

  if (!input.department.trim()) {
    errors.department = "Department is required.";
  }

  if (!Number.isFinite(input.batchYear) || input.batchYear < 2000 || input.batchYear > 2100) {
    errors.batchYear = "Enter a valid batch year.";
  }

  if (input.headline.trim().length > 120) {
    errors.headline = "Headline must be 120 characters or fewer.";
  }

  if (!input.password) {
    errors.password = "Password is required.";
  } else if (input.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  return errors;
}

export function getApiErrorMessage(error: any, fallback: string) {
  const data = error?.response?.data;
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors.join(" ");
  }

  return data?.message ?? fallback;
}
