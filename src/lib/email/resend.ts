import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);
export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "noreply@stsproject.app";

// In development, redirect all emails to your own address
export const resolveRecipient = (email: string): string => {
  if (process.env.NODE_ENV === "development") {
    return process.env.DEV_EMAIL_RECIPIENT ?? email;
  }
  return email;
};
