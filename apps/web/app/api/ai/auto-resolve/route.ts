import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

// ── Typed LogicStep schema matching shared/diagram.ts exactly ───
const LogicStepSchema = z.object({
    id: z.string().max(80),
    action: z.enum(["forward", "reply", "simulate-cache"]),
    condition: z.enum(["always", "on-hit", "on-miss", "on-success", "on-error"]),
    targetNodeId: z.string().max(80).optional(),
    hitRate: z.number().min(0).max(100).optional(),
});

const AutoResolveSchema = z.object({
    nodesToUpdate: z.array(z.object({
        id: z.string().max(80),
        patch: z.object({
            label: z.string().max(60).optional(),
            technologyId: z.string().max(60).optional(),
            processingDelay: z.number().optional(),
            concurrency: z.number().optional(),
            latencyMultiplier: z.number().optional(),
            cacheHitRate: z.number().optional(),
            hardware: z.object({
                cpuCores: z.number(),
                memoryMb: z.number()
            }).optional(),
            bandwidthCapacity: z.number().optional(),
            logicSteps: z.array(LogicStepSchema).max(10).optional(),
        }),
    })).max(10).describe("Existing nodes to patch. ONLY provide fields that need to change."),
    
    nodesToAdd: z.array(z.object({
        id: z.string().max(80),
        label: z.string().max(60),
        technologyId: z.string().max(60),
        color: z.string().max(10),
        logicSteps: z.array(LogicStepSchema).max(10).optional(),
        processingDelay: z.number().optional(),
        concurrency: z.number().optional(),
        hardware: z.object({
            cpuCores: z.number(),
            memoryMb: z.number()
        }).optional(),
        bandwidthCapacity: z.number().optional(),
    })).max(5).describe("New nodes to inject (e.g. adding a Queue). Use a short unique id like 'node-auto-q-1'."),
    
    edgesToAdd: z.array(z.object({
        id: z.string().max(80),
        source: z.string().max(80),
        target: z.string().max(80),
        event: z.string().max(80).optional(),
        protocol: z.string().max(40).optional(),
    })).max(10).describe("New wires to add between nodes."),
    
    edgesToDelete: z.array(z.string().max(80)).max(10).describe("IDs of edges to remove."),
    nodesToDelete: z.array(z.string().max(80)).max(5).describe("IDs of nodes to remove."),
    
    explanation: z.string().max(500).describe("A short, plain-English explanation of what you changed and why. Max 2-3 sentences."),
});

const SYSTEM_PROMPT = `You are a Principal Systems Architect.
Your task is to AUTO-RESOLVE a specific architectural warning or security finding.
The user provides their current system architecture (nodes and edges), and the specific error/warning message.

Your job is to provide a minimal "Patch" to fix the issue.
You can:
1. Update existing nodes (e.g., adding logic steps, upgrading hardware.cpuCores/memoryMb or bandwidthCapacity).
2. Delete invalid edges.
3. Inject new nodes (e.g., a Queue or Gateway).
4. Add new edges to wire up the new nodes.

CRITICAL VALUE RULES:
- If resolving a hardware bottleneck (like Out of Memory, CPU starvation, or network congestion), provide a 'patch' that sets 'hardware' with realistic upgraded 'cpuCores' or 'memoryMb', or upgrade 'bandwidthCapacity'.
- ALL string values MUST be SHORT. technologyId must be a simple kebab-case ID (e.g. "redis", "rabbitmq", "api-gateway", "nginx"). NEVER generate long compound strings.
- Node labels must be 1-3 words maximum (e.g. "Message Queue", "Rate Limiter").
- Node and edge IDs must be short like "node-auto-q-1" or "edge-auto-1".
- Colors must be hex codes like "#5de2e7".
- Explanations must be 1-3 sentences maximum.
- DO NOT pad or embellish any string value. Keep everything as terse as possible.

CRITICAL WIRING RULES:
- New nodes need unique IDs like "node-auto-q-1".
- New edges need unique IDs like "edge-auto-w-1".
- If you inject a node between A and B, DELETE the old A->B edge and ADD two new edges: A->NewNode and NewNode->B.
- Do NOT modify things unrelated to the specific warning.

LOGIC STEP RULES (CRITICAL):
When a node's routing logic is broken or incomplete, you MUST completely overwrite its \`logicSteps\` array with the FULL set of bidirectional steps. Never provide a partial patch for logicSteps.
- The \`id\` of each logic step must be a unique short string like "step-1", "step-2".
- The \`targetNodeId\` for a "forward" action MUST be the EXACT \`id\` (UUID or string) of the target node from the CURRENT NODES list, NOT its label or technology.
- Gateway / Load Balancer: MUST have 3 steps: forward(always) downstream, reply(on-success) to client, reply(on-error) to client.
- Microservice / Worker: MUST have 3 steps: forward(always) downstream, reply(on-success) upstream, reply(on-error) upstream.
- Database: MUST have 1 step: reply(always).
- Cache: MUST have 4 steps: simulate-cache with hitRate, reply(on-hit), forward(on-miss) to DB, reply(on-success) for DB response.
`;

export async function POST(req: Request) {
    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json(
            { error: "GEMINI_API_KEY is not set" },
            { status: 500 },
        );
    }

    try {
        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: "Request aborted or invalid JSON" }, { status: 400 });
        }
        const { nodes, edges, warning } = body;

        if (!nodes || !edges || !warning) {
            return NextResponse.json(
                { error: "Missing nodes, edges, or warning in request body" },
                { status: 400 },
            );
        }

        // Strip heavy fields from nodes to reduce prompt size and prevent hallucination
        const leanNodes = nodes.map((n: any) => ({
            id: n.id,
            label: n.data?.label ?? n.label,
            technologyId: n.data?.technologyId ?? n.technologyId,
            logicSteps: n.data?.logicSteps ?? n.logicSteps,
            hardware: n.data?.hardware ?? n.hardware,
            latency: n.data?.latency ?? n.latency,
        }));
        const leanEdges = edges.map((e: any) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            label: e.label ?? e.data?.event,
        }));

        const google = createGoogleGenerativeAI({
            apiKey: process.env.GEMINI_API_KEY,
        });

        const modelName = process.env.AI_MODEL || "gemini-3.5-flash";
        const model = google(modelName);

        const { object } = await generateObject({
            model,
            schema: AutoResolveSchema,
            system: SYSTEM_PROMPT,
            prompt: `WARNING TO FIX:\n${warning}\n\nCURRENT NODES:\n${JSON.stringify(leanNodes, null, 2)}\n\nCURRENT EDGES:\n${JSON.stringify(leanEdges, null, 2)}`,
            maxRetries: 0,
        });

        return NextResponse.json(object);
    } catch (error: any) {
        console.error("Error during auto-resolve:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate auto-resolution" },
            { status: 500 },
        );
    }
}
