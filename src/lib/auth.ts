import { cookies } from "next/headers";

const COOKIE_NAME = "okr-current-user";

export async function getCurrentUserId(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? "u-ceo";
}
