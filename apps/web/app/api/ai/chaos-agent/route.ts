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
- "errorRate" (number, packet drop/error rate 0.0 to 1.0)
- "hardware.memoryMb" (number, e.g. 1024 to 128 to cause an Out-Of-Memory crash)
- "hardware.cpuCores" (number, 1 to 64. Low cores causes queue bottlenecks)
- "bandwidthCapacity" (number, bandwidth Kbps. Low bandwidth causes payload delays)

CRITICAL RULES:
1. Structural & Hardware Mutations: You have total control. You can crash a node via OOM by mutating "hardware.memoryMb" to 128. You can cause network congestion by mutating "bandwidthCapacity". You can DELETE_NODE or DELETE_EDGE. You can rewrite routing by targeting "routingStrategy".
2. Dynamic Traffic & Payloads: You can use the 'UPDATE_TRAFFIC' action to launch DDoS attacks or large file uploads. For UPDATE_TRAFFIC, the values array must contain objects like: {"rps": 5000, "payloadKb": 500}.
3. Spawning Nodes: You can use 'ADD_NODE' to create infrastructure. For ADD_NODE, the values array must contain objects like: {"label": "Fallback DB", "technologyId": "redis", "connectedTo": "node-123", "hardware": {"memoryMb": 2048, "cpuCores": 4}, "logicSteps": [{"id": "ls1", "type": "db_query", "name": "Select", "targetNodeId": null}]}.
4. Spawning Edges: You can use 'ADD_EDGE' to wire nodes. Emit multiple ADD_EDGE mutations if you want bidirectional wiring (e.g. A to B, B to C). For ADD_EDGE, values: {"source": "node-A", "target": "node-B", "protocol": "HTTP"}.
5. Dynamic Steps: Every plan has a \`stepCount\` (e.g. 3). Every mutation MUST provide an array of \`values\` exactly matching the \`stepCount\` length. (e.g. [1024, 512, 128] for memory draining).
6. Learn from History: Do NOT repeat an experiment that is already in the history.
7. Analysis: For EVERY response, provide an 'analysis' string.
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
                        action: z.enum(['UPDATE_NODE', 'DELETE_NODE', 'DELETE_EDGE', 'ADD_NODE', 'ADD_EDGE', 'UPDATE_TRAFFIC']),
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
