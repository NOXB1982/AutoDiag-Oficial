import { ThemeToggle } from "@/components/theme-toggle"
import { SidebarNav } from "./sidebar-nav"
import { Car } from "lucide-react"
import { auth } from "@/auth"

export async function Sidebar() {
    const session = await auth()

    return (
        <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 md:flex h-screen sticky top-0">
            <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6 dark:border-gray-800">
                <div className="flex items-center gap-2 font-bold tracking-tight text-gray-900 dark:text-white">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                        <Car className="h-5 w-5 text-white" />
                    </div>
                    AutoDiag AI
                </div>
                <ThemeToggle />
            </div>
            <div className="flex-1 overflow-auto py-4">
                <SidebarNav role={session?.user?.role} />
            </div>
        </aside>
    )
}
