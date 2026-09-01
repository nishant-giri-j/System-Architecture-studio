export const maxDuration = 60; // Allow up to 60 seconds for AI generation (Vercel Pro/Hobby config)

import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';

export async function POST(req: Request) {
    try {
        const { prompt, nodes, edges, history, forceConclusion } = await req.json();

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
        const google = createGoogleGenerativeAI({ apiKey });

        const nodeSummary = (nodes || []).map((n: any) => `- [Node: ${n.id}] ${n.data.label} (type: ${n.data.technologyId})`).join('\n');
        const edgeSummary = (edges || []).map((e: any) => `- [Edge: ${e.id}] ${e.source} -> ${e.target}`).join('\n');
        
        let historyPrompt = "";
        if (history && history.length > 0) {
            historyPrompt = `\n\nHISTORY OF EXPERIMENTS RUN SO FAR:\n`;
            history.forEach((h: any, i: number) => {
                historyPrompt += `\n--- EXPERIMENT ${i + 1} ---\nPLAN: ${JSON.stringify(h.plan)}\nRESULTS: ${JSON.stringify(h.results)}\n`;
            });
            if (forceConclusion) {
                historyPrompt += `\nTHE USER HAS HALTED FURTHER EXPERIMENTS. YOU MUST OUTPUT 'CONCLUDE' NOW and summarize what you found in the history.`;
            }
        }

        const result = await generateObject({
            model: google(process.env.AI_MODEL || 'gemini-2.5-pro'),
            system: `You are an elite Autonomous Chaos Monkey & Architecture Designer.
Your job is to read a user's natural language request, analyze their system, and iteratively propose structured experiments.

You run in a loop. You will be provided with the user's prompt and a HISTORY of experiments you have already tried.
- Output 'PROPOSE_EXPERIMENTS' to provide the user with 2 to 3 distinct test plan options for their next step. You must ALWAYS propose more experiments unless the user explicitly forced a stop.
- ONLY output 'CONCLUDE' if the prompt explicitly says 'THE USER HAS HALTED FURTHER EXPERIMENTS'. Do not conclude on your own.

Available Nodes in the user's architecture:
${nodeSummary}

Available Edges (Wiring):
${edgeSummary}

Valid Target Fields you can mutate in UPDATE_NODE:
- "latency.base" (number, base latency in ms, 5 to 500)
- "processingDelay" (number, processing delay in ms, 0 to 500)
- "errorRate" (number, packet drop/error rate 0.0 to 1.0. 1.0 = total outage)

CRITICAL RULES:
1. Structural Mutations: You can perform multiple actions simultaneously. E.g. to crash a whole database tier, you can DELETE_NODE multiple databases, or UPDATE_NODE their errorRate to 1.0. You can delete wires (DELETE_EDGE) to simulate network partitions.
2. Dynamic Steps: Every plan has a \`stepCount\` (e.g. 3). Every mutation you provide MUST provide an array of \`values\` exactly matching the \`stepCount\` length.
   - For UPDATE_NODE: e.g. values: [0.0, 0.5, 1.0] (for 3 steps).
   - For DELETE_NODE / DELETE_EDGE: e.g. values: [false, true, true] (false = normal, true = deleted).
3. Learn from History: Do NOT repeat an experiment that is already in the history.
4. Analysis: For EVERY response, provide an 'analysis' string. If proposing, write a short analysis of the latest results. If concluding, write a massive detailed Markdown report.
`,
            prompt: `USER PROMPT: ${prompt}${historyPrompt}`,
            schema: z.object({
                decision: z.enum(['PROPOSE_EXPERIMENTS', 'CONCLUDE']),
                analysis: z.string().describe("Your analysis of the current state or history."),
                plans: z.array(z.object({
                    title: z.string(),
                    hypothesis: z.string(),
                    stepCount: z.number().describe("The total number of time steps for this experiment, e.g. 3 or 4"),
                    mutations: z.array(z.object({
                        action: z.enum(['UPDATE_NODE', 'DELETE_NODE', 'DELETE_EDGE']),
                        targetId: z.string().describe("The ID of the Node or Edge"),
                        targetField: z.string().optional().describe("For UPDATE_NODE, e.g. 'errorRate', 'processingDelay', 'latency.base'"),
                        values: z.array(z.any()).describe("An array of values mapping to each step. Length MUST exactly equal stepCount.")
                    })).min(1),
                    maxInFlight: z.number().default(100),
                    totalLimit: z.number().default(1000),
                    playbackSpeed: z.number().default(2),
                    requestsPerSecond: z.number().default(100)
                })).optional()
            })
        });

        return Response.json(result.object);
    } catch (e: any) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}
