"use client"

import { useState, useRef, useEffect } from "react"
import { askDiagnosticQuestion } from "@/app/actions/chat"
import { Send, Bot, User, Loader2, Wrench, AlertCircle } from "lucide-react"

export interface ChatMessage {
    role: 'user' | 'ai';
    content: string;
}

interface DiagnosticChatProps {
    diagnosticResult: any;
}

export function DiagnosticChat({ diagnosticResult }: DiagnosticChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial Welcome Message based on anomalies
    useEffect(() => {
        if (messages.length === 0 && diagnosticResult) {
            let errorCount = 0;
            let warningCount = 0;
            
            if (diagnosticResult.parameters) {
                diagnosticResult.parameters.forEach((p: any) => {
                    if (p.status === 'error') errorCount++;
                    if (p.status === 'warning') warningCount++;
                });
            }

            const welcomeMsg = `Olá mecânico! Detetei ${errorCount} erros e ${warningCount} avisos nos parâmetros desta leitura em tempo real. Podes perguntar-me qualquer dúvida sobre a correlação destes danos (ex: "Será que o valor alto na MAF é causado por um tubo de vácuo partido?") ou como testar fisicamente as peças indicadas.`;
            
            setMessages([{ role: 'ai', content: welcomeMsg }]);
        }
    }, [diagnosticResult, messages.length]);

    // Auto-scroll logic
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isThinking) return;

        const userText = input.trim();
        setInput("");
        
        const newMessages: ChatMessage[] = [...messages, { role: 'user', content: userText }];
        setMessages(newMessages);
        setIsThinking(true);

        try {
            // Re-map messages to the required backend structure
            const history = messages.map(m => ({
                role: m.role,
                content: m.content
            }));
            
            const res = await askDiagnosticQuestion(diagnosticResult, history as any, userText);
            
            if (res.success && res.answer) {
                setMessages(prev => [...prev, { role: 'ai', content: res.answer as string }]);
            } else {
                setMessages(prev => [...prev, { role: 'ai', content: `⚠️ Ocorreu um erro no servidor de comunicação técnica: ${res.error}` }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', content: "⚠️ Falha de rede. O Engenheiro IA não pode responder neste momento." }]);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="flex flex-col border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-950 shadow-sm overflow-hidden h-[500px] lg:h-[600px] max-h-[70vh] mt-8">
            {/* Header */}
            <div className="bg-blue-600 dark:bg-blue-900 border-b border-blue-700 dark:border-blue-950 px-4 py-3 flex items-center gap-3 shrink-0">
                <div className="bg-white/20 p-2 rounded-lg flex items-center justify-center shrink-0">
                    <Wrench className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h3 className="text-white font-bold text-base leading-tight">Chat Técnico / Assistente AutoDiag</h3>
                    <p className="text-blue-100 text-xs">Conversação com contexto focado nos valores capturados.</p>
                </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-black">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 select-none ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'}`}>
                            {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-5 w-5" />}
                        </div>
                        <div className={`py-2 px-3 lg:px-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-sm shadow-sm'}`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                
                {isThinking && (
                    <div className="flex gap-3 max-w-[85%] mr-auto">
                        <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 select-none bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                            <Bot className="h-5 w-5" />
                        </div>
                        <div className="py-3 px-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-tl-sm shadow-sm flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                            <span className="text-xs text-gray-500 font-medium">AutoDiag IA a analisar valores mecânicos...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} className="h-1" />
            </div>

            {/* Input Box */}
            <form onSubmit={handleSend} className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 p-3 shrink-0 flex items-end gap-2">
                <div className="relative flex-1">
                    <textarea 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend(e);
                            }
                        }}
                        placeholder="Pergunta se a Falha de Combustão provém destes parâmetros..."
                        className="w-full bg-gray-100 dark:bg-gray-900 border-0 rounded-xl pl-4 pr-10 py-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 h-[50px] max-h-[120px] dark:text-white"
                        rows={1}
                        style={{ minHeight: '50px' }}
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={!input.trim() || isThinking}
                    className="shrink-0 h-[50px] w-[50px] rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center justify-center text-white transition-colors"
                >
                    <Send className="h-5 w-5 ml-1" />
                </button>
            </form>
        </div>
    );
}
