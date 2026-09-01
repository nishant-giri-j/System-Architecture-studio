with open('apps/web/app/api/ai/chaos-agent/route.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_code = """import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';

export async function POST(req: Request) {
    try {
        const { prompt, nodes, history, forceConclusion } = await req.json();

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
        const google = createGoogleGenerativeAI({ apiKey });

        const nodeSummary = nodes.map((n: any) => `- [${n.id}] ${n.data.label} (type: ${n.data.technologyId})`).join('\\n');
        
        let historyPrompt = "";
        if (history && history.length > 0) {
            historyPrompt = `\\n\\nHISTORY OF EXPERIMENTS RUN SO FAR:\\n`;
            history.forEach((h: any, i: number) => {
                historyPrompt += `\\n--- EXPERIMENT ${i + 1} ---\\nPLAN: ${JSON.stringify(h.plan)}\\nRESULTS: ${JSON.stringify(h.results)}\\n`;
            });
            if (forceConclusion) {
                historyPrompt += `\\nTHE USER HAS HALTED FURTHER EXPERIMENTS. YOU MUST OUTPUT 'CONCLUDE' NOW and summarize what you found in the history.`;
            }
        }

        const result = await generateObject({
            model: google(process.env.AI_MODEL || 'gemini-2.5-pro'),
            system: `You are an elite Autonomous Chaos Monkey & Performance Analyst for an architecture canvas tool.
Your job is to read a user's natural language request (e.g. "find a breaking point", "test the database"), and then iteratively run experiments until you prove or disprove the hypothesis, or find a critical failure point.

You run in a loop. You will be provided with the user's prompt and a HISTORY of experiments you have already tried.
- If you need to gather data, output 'PROPOSE_EXPERIMENTS' and provide 2 to 3 distinct test plan options for the user to choose from.
- If you have successfully answered the prompt (e.g., you broke the system, or you tried a few things and concluded it's perfectly resilient), or if the user forced a stop, output 'CONCLUDE' and provide a detailed Markdown report.

Available Nodes in the user's architecture:
${nodeSummary}

Valid Target Fields you can mutate in PROPOSE_EXPERIMENTS:
- "latency.base" (number, base latency in ms, 5 to 500)
- "processingDelay" (number, processing delay in ms, 0 to 500)
- "errorRate" (number, packet drop/error rate 0.0 to 1.0. 1.0 = total outage)

CRITICAL RULES:
1. Dynamic Steps: When proposing experiments, each plan must include an array of numeric values to test in sequence (e.g. [0.0, 0.5, 1.0]). Provide a descriptive title for each plan.
2. Learn from History: Do NOT repeat an experiment that is already in the history. If changing latency didn't break it, try errorRate, or try a different node!
3. Formatting Rules for CONCLUDE: 
   - Keep the text extremely clean, readable, and easy to understand.
   - Use standard text arrows (e.g., '->' or '?'). DO NOT use LaTeX math symbols like '$\\\\rightarrow$'.
   - Use bold text, bullet points, and clear headings.
   - Write a DEEP, highly detailed analytical report explaining exactly what you tested and what the results imply. Use professional typography with multiple headings, bold text, and bullet points. Explain ALL the experiments you ran from the history, what their graphs/metrics showed, and what the final conclusion is. Do not be brief.`,
            prompt: `USER PROMPT: ${prompt}${historyPrompt}`,
            schema: z.object({
                decision: z.enum(['PROPOSE_EXPERIMENTS', 'CONCLUDE']).describe("Decide whether to propose next experiments, or output the final Markdown report."),
                plans: z.array(z.object({
                    title: z.string().describe("A short, catchy title for this experiment option (e.g. 'Option A: Spike DB Latency')"),
                    targetNodeId: z.string().describe("The ID of the node to mutate"),
                    targetField: z.string().describe("The dot-notated field to mutate on the node's data object"),
                    steps: z.array(z.number()).min(1).describe("The sequence of values to test"),
                    hypothesis: z.string().describe("A brief expectation of what will happen in the simulation"),
                    maxInFlight: z.number().default(100),
                    totalLimit: z.number().default(1000),
                    playbackSpeed: z.number().default(2),
                    requestsPerSecond: z.number().default(100)
                })).optional().describe("2-3 distinct experiment options to propose to the user. Required if decision is PROPOSE_EXPERIMENTS."),
                analysis: z.string().optional().describe("Detailed markdown report summarizing all experiments. Required if decision is CONCLUDE.")
            })
        });

        return Response.json(result.object);
    } catch (e: any) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}
"""

with open('apps/web/app/api/ai/chaos-agent/route.ts', 'w', encoding='utf-8') as f:
    f.write(new_code)
