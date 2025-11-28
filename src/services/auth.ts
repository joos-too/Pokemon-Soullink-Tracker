import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/src/firebaseConfig";

const normalizeEmail = (email?: string | null): string =>
  email?.trim().toLowerCase() ?? "";

export const requestPasswordReset = async (
  rawEmail?: string | null,
): Promise<void> => {
  const email = normalizeEmail(rawEmail);
  if (!email) {
    throw new Error("Dein Account besitzt keine gültige Email-Adresse.");
  }

  await sendPasswordResetEmail(auth, email);
};
