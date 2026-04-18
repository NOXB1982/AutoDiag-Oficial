import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const start = Date.now();
        
        // 1. Check Database
        await prisma.$queryRaw`SELECT 1`;
        
        // 2. Check GenAI
        let aiStatus = 'ok';
        try {
            if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            await ai.models.generateContent({
                model: 'gemini-3.1-pro-preview',
                contents: "ping",
            });
        } catch (e: any) {
            console.error("Health Check GenAI Error:", e);
            aiStatus = 'error';
            // We won't crash the health check if Google API drops, but we flag it
        }

        const metrics = {
            status: aiStatus === 'ok' ? 'ok' : 'degraded',
            database: 'ok',
            gemini: aiStatus,
            latency_ms: Date.now() - start,
            timestamp: new Date().toISOString()
        };

        return NextResponse.json(metrics, { status: aiStatus === 'ok' ? 200 : 503 });

    } catch (error: any) {
        console.error("Health Check Critical Failure:", error);
        return NextResponse.json({
            status: "error",
            message: "Database or internal node unreachable.",
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
