import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(url, key);

export function quizFromUser(user) {
  const quiz = user?.user_metadata?.quiz;
  if (!quiz || typeof quiz !== "object" || Array.isArray(quiz)) return null;
  return {
    grade: String(quiz.grade || ""),
    school: String(quiz.school || ""),
    schoolId: String(quiz.schoolId || ""),
    schoolCity: String(quiz.schoolCity || ""),
    schoolState: String(quiz.schoolState || ""),
    schoolKind: String(quiz.schoolKind || ""),
    income: String(quiz.income || ""),
    household: Number(quiz.household) || 1,
    eligible: Boolean(quiz.eligible),
    reasons: Array.isArray(quiz.reasons) ? quiz.reasons.map(String) : [],
    savedAt: String(quiz.savedAt || ""),
  };
}

export function accountFromUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.user_metadata?.name || "",
    email: user.email || "",
    phone: user.user_metadata?.phone || "",
    createdAt: user.created_at || "",
  };
}

export function authMessage(error) {
  const message = String(error?.message || "");
  if (/already registered|already been registered/i.test(message)) {
    return "That email already has an account. Log in instead.";
  }
  if (/invalid login credentials/i.test(message)) return "That email and password do not match.";
  if (/email not confirmed/i.test(message)) return "Confirm the email first, then log in.";
  return message || "The account service did not respond.";
}
