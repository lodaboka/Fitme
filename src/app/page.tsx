// ============================================================
// Fit Me v2 — Root Page (redirect to dashboard or login)
// ============================================================

import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
