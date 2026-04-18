import React from 'react'
import Link from 'next/link'
import { ShieldAlert, ArrowLeft } from 'lucide-react'

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/login" className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Início
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="bg-indigo-600 dark:bg-indigo-900 px-6 py-8 sm:p-10 text-center">
            <ShieldAlert className="h-12 w-12 text-white mx-auto mb-4 opacity-90" />
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Termos de Responsabilidade</h1>
            <p className="mt-2 text-indigo-100 font-medium">AutoDiag IA - Assistente Técnico Profissional</p>
          </div>

          <div className="px-6 py-8 sm:p-10 text-gray-700 dark:text-gray-300 space-y-8 text-base leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">1. Natureza do Serviço</h2>
              <p>
                A <strong>AutoDiag IA</strong> é uma ferramenta de software baseada em Inteligência Artificial desenhada exclusivamente para auxiliar profissionais de mecânica automóvel, mecatrónica e eletricistas auto. O sistema atua como um <em>assistente consultivo</em> na interpretação de dados (DTCs, leituras de scanner, manuais e esquemas) e não substitui de forma alguma o diagnóstico físico elaborado no local por um técnico certificado.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">2. Isenção de Responsabilidade Técnica</h2>
              <p>
                As informações, guias de medição, esquemas e "Dicas do Mestre" fornecidos pela plataforma são extraídos e cruzados algoritmicamente. Devido à vasta diversidade de anos, marcas, modelos e compatibilidades de centralinas, <strong>a AutoDiag exime-se de qualquer responsabilidade por danos materiais, avarias agravadas, curtos-circuitos ou perda de dados em módulos de controlo resultantes da aplicação direta das sugestões da Inteligência Artificial.</strong>
              </p>
              <p className="mt-4 font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-100 dark:border-red-900/30">
                A responsabilidade final pela intervenção técnica, substituição de peças, cortes de cablagem ou reprogramação eletrónica recai VOLUNTÁRIA E EXCLUSIVAMENTE sobre o Mecânico/Oficina executante. É obrigação do profissional aferir fisicamente (ex: medições com multímetro ou osciloscópio) os componentes antes de qualquer substituição.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">3. Propriedade Intelectual e Proteção (Rate Limiting)</h2>
              <p>
                A fim de proteger a integridade do serviço e evitar furtos de quota de API (Abuso Hacking), a plataforma aplica controlos automáticos por IP. Bloqueios temporários de acesso podem ser ativados caso o sistema detete varreduras excessivas (ex: {'>'} 10 diagnósticos/hora) na análise de imagem. Tentativas de contornar este limite resultarão na suspensão do acesso à base de dados.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">4. Aceitação</h2>
              <p>
                Ao interagir com o portal de diagnóstico inteligente, submeter imagens de leitores OBD ou processar esquemas técnicos, o utilizador reconhece e aceita integralmente estes Termos de Limitação de Responsabilidade, atuando na viatura à sua própria inteira responsabilidade profissional.
              </p>
            </section>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-t border-gray-200 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400 text-center font-medium">
            Última atualização: {new Date().toLocaleDateString('pt-PT')} © AutoDiag IA. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </div>
  )
}
