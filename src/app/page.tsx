import { auth } from "@/auth"
import { DashboardClient } from "@/components/dashboard-client"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await auth()

  if (!session || !session.user) {
    redirect("/login")
  }

  if (session.user.role === "SUPER_ADMIN") {
    redirect("/admin")
  }

  return <DashboardClient user={session.user} />
}
