import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { AiLogicTestSchema } from "@architecture-studio/shared";

const SYSTEM_PROMPT = `
You are an expert Principal Systems Architect performing a deep logical and resilience review of a system architecture diagram.

The user will provide a JSON array of "nodes" (services, databases, clients) and "edges" (connections between them). Each node contains a list of "logicSteps" that define what it does when it receives a request, and a "latency" configuration.

Your task is to analyze the logical correctness, data flow, error handling, component compatibility, and latency/bottleneck risks of the architecture.

# ANALYSIS REQUIREMENTS:

1. Routing & Data Flow Verification:
- Infinite Loops & Circular Dependencies (Deadlocks): Do nodes call each other in a loop without breaking? The simulation engine will drop these packets as deadlocks.
- Request Black Holes & Missing Logic: Does a node have an empty logicSteps array? The engine will drop the packet with a "Missing Logic" error if a node has no logic.
- Architectural Anti-Patterns (Invalid Wiring): e.g., A client frontend connecting directly to a database without an API layer, or a queue connecting directly to a database without a worker service.

2. Technology, Protocol & Latency Analysis:
- Processing Delay & Bottlenecks: Look at the node's latency configuration (workload, concurrency, networkHops, nodeOverrideMs), hardware configuration (cpuCores, memoryMb), and bandwidthCapacity.
- Hardware Starvation: If a node handles high throughput but has 1-2 CPU cores, very low memory, or low bandwidth (e.g. 1000 Kbps), flag it as a severe hardware bottleneck risk.
- Protocol Mismatch: Are two nodes communicating using a protocol that makes no sense? (e.g., Redis via SQL, Kafka via REST).
- Cache Thrashing: If a node has a "simulate-cache" logic step, is the hitRate configured so low (e.g., < 30%) that it causes cache thrashing?
- Logic Step Compatibility: Is a node trying to do something impossible? (e.g. running complex SQL JOINs on a Redis cache).
- Protocol Suitability: Are edges using the right protocol?

3. Resilience & Reliability Analysis:
- Starvation & Queue Overflow: Are high-throughput clients hammering a very slow processing node? The engine hard-drops packets with a 503 error if a node's queue fills up beyond its capacity, or warns about starvation if the queue grows too large.
- "What-if" Chaos Simulation: If a database or cache fails, does the upstream service have logic steps (e.g., 'on-error' condition) to handle the error or fallback?
- Idempotency & Retry Checks: For asynchronous workers consuming from queues, do they have logic to handle duplicate messages?

# OUTPUT CONSTRAINTS:

- Group your findings into three categories: "routing", "constraint", and "resilience".
- For each finding, provide a status: "pass", "warn", or "error".
- VERY IMPORTANT: Focus mostly on what is broken! Minimize "pass" assertions. Only include 1 or 2 "pass" assertions if a complex part of the architecture is exceptionally well-designed. Otherwise, ONLY output warnings and errors to save tokens and focus the user's attention.
- Ensure 'affectedNodeIds' and 'affectedEdgeIds' point strictly to the 'id' fields provided in the user's input.
- Give actionable remediations for warnings and errors.
- Provide a brief summary of the architecture's logical correctness.
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
        } catch (err) {
            return NextResponse.json({ error: "Request aborted or invalid JSON" }, { status: 400 });
        }
        
        const { nodes, edges } = body;

        if (!nodes || !edges) {
            return NextResponse.json(
                { error: "Missing nodes or edges in request body" },
                { status: 400 },
            );
        }

        const google = createGoogleGenerativeAI({
            apiKey: process.env.GEMINI_API_KEY,
        });

        const modelName = process.env.AI_MODEL || "gemini-3.5-flash";
        const model = google(modelName);

        const { object } = await generateObject({
            model,
            schema: AiLogicTestSchema as any, // Cast as any to avoid complex TS inferences in some zod versions
            system: SYSTEM_PROMPT,
            prompt: `Review this architecture:\n\nNODES:\n${JSON.stringify(nodes, null, 2)}\n\nEDGES:\n${JSON.stringify(edges, null, 2)}`,
            maxRetries: 0,
        });

        return NextResponse.json(object);
    } catch (error: any) {
        console.error("Error during logic tester:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate logic test" },
            { status: 500 },
        );
    }
}
