import { getAdminDashboardStats } from "@/app/actions/admin"
import { CreateWorkshopModal } from "@/components/create-workshop-modal"
import { Users, Activity, Wrench } from "lucide-react"
import { DeleteWorkshopButton } from "@/components/delete-workshop-button"

export default async function AdminDashboardPage() {
    const stats = await getAdminDashboardStats()

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-20">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">Painel de Supervisão</h2>
                    <p className="text-gray-500 dark:text-gray-400">Gira os acessos das oficinas testadoras e acompanhe a volumetria de uso do AutoDiag AI.</p>
                </div>
                <CreateWorkshopModal />
            </header>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Oficinas Ativas</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalWorkshops} <span className="text-sm text-gray-400 font-normal">Contas</span></h3>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                            <Activity className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Diagnósticos Gerados</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalDiagnostics} <span className="text-sm text-gray-400 font-normal">Análises IA</span></h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-gray-400" />
                        Listagem de Mecânicos / Oficinas
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800 uppercase text-xs font-semibold tracking-wider">
                            <tr>
                                <th scope="col" className="px-6 py-4">Nome da Oficina</th>
                                <th scope="col" className="px-6 py-4">Credenciais (Email)</th>
                                <th scope="col" className="px-6 py-4 text-center">Data Adesão</th>
                                <th scope="col" className="px-6 py-4 text-center">Último Acesso</th>
                                <th scope="col" className="px-6 py-4">Dispositivo</th>
                                <th scope="col" className="px-6 py-4 text-center">Diagnósticos Lidos</th>
                                <th scope="col" className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-950">
                            {stats.workshopsWithStats.map((workshop: any) => (
                                <tr key={workshop.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                        {workshop.name}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-mono">
                                        {workshop.email}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-500 text-center">
                                        {new Date(workshop.createdAt).toLocaleDateString('pt-PT')}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-500 text-center">
                                        {workshop.lastLogin ? new Date(workshop.lastLogin).toLocaleDateString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs truncate max-w-[200px]" title={workshop.lastDevice || ""}>
                                        {workshop.lastDevice || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold text-xs ring-1 ring-inset ring-blue-600/20 dark:ring-blue-500/20">
                                            {workshop._count.diagnostics}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end">
                                            <DeleteWorkshopButton userId={workshop.id} userName={workshop.name || workshop.email} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {stats.workshopsWithStats.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                                        Nenhuma oficina registada ainda. Clique em "Nova Oficina" para começar.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
