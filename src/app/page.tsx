import { auth } from "@/auth"
import { DashboardClient } from "@/components/dashboard-client"
import { redirect } from "next/navigation"
import { getUserDiagnostics } from "@/app/actions/diagnostics"

export const maxDuration = 60; // Extend Vercel Serverless timeout to 60s for PDF Actions

export default async function Home() {
  const session = await auth()

  if (!session || !session.user) {
    // redirect("/login")
  }

  if (session?.user?.role === "SUPER_ADMIN") {
    redirect("/admin")
  }

  const initialDiagnostics = await getUserDiagnostics()

  return <DashboardClient user={session?.user || {}} initialHistory={initialDiagnostics} />
}
