"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, Shield, Car, Settings } from "lucide-react"

export function SidebarNav({ role }: { role?: string }) {
    const pathname = usePathname()

    const navItems = [
        { name: "Análises", href: "/", icon: Activity },
        { name: "Viaturas", href: "/viaturas", icon: Car },
        { name: "Ajustes", href: "/ajustes", icon: Settings },
    ]

    if (role === "SUPER_ADMIN") {
        navItems.push({ name: "Administração", href: "/admin", icon: Shield })
    }

    return (
        <nav className="flex flex-col gap-1 px-4">
            {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${isActive
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
                            }`}
                    >
                        <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-400"}`} />
                        {item.name}
                    </Link>
                )
            })}
        </nav>
    )
}
