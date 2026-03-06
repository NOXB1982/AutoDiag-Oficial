"use client"

import { authenticate } from "@/app/actions/auth"
import { useActionState } from "react"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
    const [errorMessage, dispatch, isPending] = useActionState(
        authenticate,
        undefined,
    )

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] text-gray-100">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center flex-col items-center">
                    <div className="h-16 w-16 bg-lime-500 rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(132,204,22,0.4)] mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-950"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
                    </div>
                    <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-white mb-2">AutoDiag AI <span className="text-lime-500 text-sm align-top ml-1 border border-lime-500/30 bg-lime-500/10 px-2 py-0.5 rounded-full font-mono">PRO</span></h2>
                    <p className="text-sm font-medium text-gray-400">Entre com as suas credenciais de oficina testadora.</p>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-gray-900 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-gray-800 relative overflow-hidden">

                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-lime-400 via-emerald-500 to-teal-500"></div>

                    <form action={(formData) => {
                        formData.append("device", navigator.userAgent)
                        dispatch(formData)
                    }} className="space-y-6">

                        {errorMessage && (
                            <div className="p-3 text-sm text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-400 rounded-md border border-red-200 dark:border-red-800/50">
                                {errorMessage}
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                                Endereço de Email
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="appearance-none block w-full px-4 py-3 border border-gray-700 rounded-xl shadow-sm placeholder-gray-500 bg-gray-950 text-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent sm:text-sm transition-colors"
                                    placeholder="oficina@exemplo.pt"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                                Palavra-passe
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="appearance-none block w-full px-4 py-3 border border-gray-700 rounded-xl shadow-sm placeholder-gray-500 bg-gray-950 text-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent sm:text-sm transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                aria-disabled={isPending}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-[0_0_15px_rgba(132,204,22,0.15)] text-sm font-bold text-gray-950 bg-lime-400 hover:bg-lime-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-lime-500 transition-all hover:shadow-[0_0_20px_rgba(132,204,22,0.3)] uppercase tracking-wider aria-disabled:opacity-50 aria-disabled:cursor-not-allowed"
                            >
                                {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Autenticar Painel'}
                            </button>
                        </div>

                    </form>
                </div>

                <p className="mt-6 text-center text-xs font-medium text-gray-500 dark:text-gray-500 max-w-sm mx-auto">
                    Versão Beta Privada. O uso desta plataforma é exclusivo para parceiros autorizados e está sujeito a confidencialidade.
                </p>
            </div>
        </div>
    )
}
