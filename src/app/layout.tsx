import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Sidebar } from "@/components/sidebar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AutoDiag AI",
  description: "Diagnóstico automóvel assistido por Inteligência Artificial",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AutoDiag",
  },
  icons: {
    icon: [
      { url: '/icon.png' },
      new URL('/icon.png', 'https://autodiag.pt'),
    ],
    shortcut: ['/icon.png'],
    apple: [
      { url: '/icon.png' },
      { url: '/icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-PT" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100 flex min-h-screen`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Sidebar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
