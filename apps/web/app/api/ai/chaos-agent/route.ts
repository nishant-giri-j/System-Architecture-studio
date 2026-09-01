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

        const model = google(process.env.AI_MODEL || 'gemini-3.1-pro-preview');

        const { object } = await generateObject({
            model,
            system: `You are an expert Chaos Engineering and System Architecture AI.
Your job is to propose experiments to break or scale the user's system, OR conclude if requested or if you've exhausted hypotheses.

CURRENT ARCHITECTURE:
${nodeSummary}

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
3. Spawning Nodes (ADD_NODE): You MUST format the ADD_NODE value EXACTLY like this JSON object:
{"label": "Auth Middleware", "technologyId": "nodejs", "incomingConnections": ["gateway-id"], "outgoingConnections": ["service-id"], "hardware": { "memoryMb": 2048, "cpuCores": 2 }, "logicSteps": [{ "id": "s1", "action": "forward", "targetNodeId": "service-id", "condition": "always" }, { "id": "s2", "action": "reply", "condition": "always" }]}
NEVER use a flat array or stringified JSON for logicSteps or hardware! They MUST be proper nested JSON objects! ALWAYS explicitly define 'targetId' in the mutation so you can reference it.
4. Integrating Nodes: If you ADD_NODE, it sits idle unless upstream nodes route traffic to it! Use 'UPDATE_NODE' targeting "logicSteps" on upstream nodes to rewrite their logic array to include a 'forward' step pointing to your new node's targetId. You are given the current LogicSteps; supply the FULL modified array in your mutation value!
5. Logic Step Engine (CRITICAL): The simulation is bidirectional! If a node receives a request, it MUST have a 'reply' step (e.g. {"id":"r1", "action":"reply", "condition":"always"}) to send the response back! If you omit 'reply', packets get stuck in a routing black hole! Use 'forward' to send packets to downstream dependencies.
6. Dynamic Steps: Every plan has a \`stepCount\` (e.g. 3). Every mutation MUST provide an array of \`values\` exactly matching the \`stepCount\` length.
7. Learn from History: Do NOT repeat an experiment that is already in the history.
8. Analysis: For EVERY response, provide an 'analysis' string.
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

        return Response.json(object);
    } catch (e: any) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}
