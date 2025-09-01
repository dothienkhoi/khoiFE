// src/app/(admin)/admin/page.tsx

import { redirect } from "next/navigation";

// Redirect the main admin page to the dashboard
export default function AdminPage() {
  redirect("/admin/dashboard");
}
