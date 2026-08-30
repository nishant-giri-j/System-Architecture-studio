import { z } from "zod";

// ── Technology Categories ─────────────────────────────────────
export const TechnologyCategorySchema = z.enum([
    "client",
    "network",
    "service",
    "data",
    "messaging",
    "cache",
    "storage",
    "compute",
    "observability",
    "security",
    "boundary",
]);

// ── Security Review ───────────────────────────────────────────
export const AiSecurityReviewSchema = z.object({
    vulnerabilities: z.array(z.object({
        id: z.string().describe("Unique identifier for this vulnerability, e.g. 'vuln-1'"),
        title: z.string().describe("Short, descriptive title of the risk"),
        severity: z.enum(["low", "medium", "high", "critical"]),
        type: z.enum(["spof", "bottleneck", "security", "zero-day", "compliance"]),
        description: z.string().describe("Detailed explanation of the risk and why it exists in this architecture"),
        affectedNodeIds: z.array(z.string()).describe("Array of node IDs that are affected by or cause this vulnerability"),
        remediation: z.string().describe("Actionable steps to fix or mitigate the vulnerability"),
    })),
    summary: z.string().describe("A 1-2 sentence overall summary of the architecture's security posture"),
    overallRiskScore: z.number().min(0).max(100).describe("0 = Perfect security, 100 = Extremely vulnerable"),
});
export type AiSecurityReviewResult = z.infer<typeof AiSecurityReviewSchema>;

// ── Logic Tester ──────────────────────────────────────────────
export const AiLogicTestSchema = z.object({
    assertions: z.array(z.object({
        id: z.string().describe("Unique identifier for this assertion, e.g. 'assert-1'"),
        status: z.enum(["pass", "warn", "error"]),
        category: z.enum(["routing", "constraint", "resilience"]),
        title: z.string().describe("Short, descriptive title of the check"),
        description: z.string().describe("Detailed explanation of the issue or check"),
        affectedNodeIds: z.array(z.string()).describe("Array of node IDs involved in this assertion"),
        affectedEdgeIds: z.array(z.string()).describe("Array of edge IDs involved in this assertion"),
        remediation: z.string().optional().describe("Actionable steps to fix the issue (if warning or error)"),
    })),
    summary: z.string().describe("A 1-2 sentence overall summary of the architecture's logical correctness"),
});
export type AiLogicTestResult = z.infer<typeof AiLogicTestSchema>;
export type LogicAssertion = AiLogicTestResult["assertions"][number];

// ── Logic Step (fills the node's logic panel) ─────────────────
export const AiLogicStepSchema = z.object({
    action: z.enum(["forward", "reply", "simulate-cache"]),
    targetNodeId: z
        .string()
        .optional()
        .describe(
            "Required for 'forward' action. Must reference another node's id that this node connects to via an edge.",
        ),
    condition: z.enum([
        "always",
        "on-hit",
        "on-miss",
        "on-success",
        "on-error",
    ]),
    hitRate: z
        .number()
        .min(0)
        .max(100)
        .optional()
        .describe(
            "Only for 'simulate-cache' action. Realistic cache hit percentage (typically 70-95%).",
        ),
});

// ── Architecture Node ─────────────────────────────────────────
export const AiNodeSchema = z.object({
    id: z
        .string()
        .describe("Unique node identifier, e.g. 'node-api-gateway', 'node-redis'"),
    label: z
        .string()
        .describe("Display label, e.g. 'API Gateway', 'Redis Cache'"),
    technologyId: z
        .string()
        .describe(
            "Technology identifier in kebab-case. Use existing library IDs when possible.",
        ),
    category: TechnologyCategorySchema,
    color: z.string().describe("Hex color string, e.g. '#3B82F6'"),
    description: z
        .string()
        .describe(
            "Brief description of what this node does in the architecture",
        ),
    logicSteps: z
        .array(AiLogicStepSchema)
        .min(1)
        .describe(
            "Step-by-step request handling logic. Every node MUST have at least one step defining its real-world behavior.",
        ),
    processingDelay: z
        .number()
        .default(0)
        .describe("Simulated processing delay in milliseconds"),
    routingStrategy: z
        .enum(["broadcast", "load-balance"])
        .default("broadcast")
        .describe("How this node routes traffic. Use 'load-balance' for API Gateways/Load Balancers to pick one downstream target. Use 'broadcast' for general fan-out."),
    latency: z.object({
        latencyMultiplier: z.number().describe("Multiplier for base latency, typically 1.0"),
        cacheHitRate: z.number().describe("Global cache hit rate for the node (0-100)"),
        concurrency: z.number().describe("Expected concurrent requests multiplier (1 is default)"),
        workload: z.enum(['light', 'normal', 'heavy']).describe("General workload intensity for this node"),
        networkHops: z.number().describe("Number of network hops to reach this node (0 for same machine)"),
        nodeOverrideMs: z.number().describe("Absolute latency floor / minimum added delay in milliseconds")
    }).describe("Realistic physical latency model configuration for this node. You MUST fill this in entirely."),
});

// ── Architecture Edge (Wire) ──────────────────────────────────
export const AiEdgeSchema = z.object({
    id: z.string().describe("Unique edge identifier, e.g. 'edge-1'"),
    sourceNodeId: z
        .string()
        .describe("Source node id — the node that sends the request"),
    targetNodeId: z
        .string()
        .describe("Target node id — the node that receives the request"),
    event: z
        .string()
        .describe(
            "Descriptive event/action name, e.g. 'HTTP GET /api/users', 'order.created', 'Cache Lookup'",
        ),
    protocol: z
        .string()
        .describe(
            "Communication protocol, e.g. 'REST', 'gRPC', 'Kafka', 'WebSocket', 'SQL'",
        ),
    edgeStyle: z
        .enum(["bezier", "step", "straight", "smoothstep"])
        .default("bezier")
        .describe(
            "Visual curve type. Use 'bezier' for most connections, 'step' for async/queue connections.",
        ),
});

// ── New Technology (only if not in existing library) ──────────
export const AiNewTechnologySchema = z.object({
    id: z.string().describe("kebab-case identifier, e.g. 'scylladb'"),
    label: z.string().describe("Display name, e.g. 'ScyllaDB'"),
    category: TechnologyCategorySchema,
    color: z.string().describe("Hex color, e.g. '#6C8EBF'"),
    description: z.string().describe("Brief technology description"),
    info: z
        .object({
            overview: z.string(),
            howItWorks: z.string(),
            useCases: z.array(z.string()),
            advantages: z.array(z.string()),
            disadvantages: z.array(z.string()),
            performance: z.string(),
            security: z.string(),
            alternatives: z.array(z.string()),
        })
        .describe("Full TechnologyInfo matching the library format"),
});

// ── New Protocol (only if not in existing library) ────────────
export const AiNewProtocolSchema = z.object({
    id: z.string().describe("Protocol identifier, e.g. 'NATS JetStream'"),
    label: z.string().describe("Display name"),
    category: z.string().describe("Protocol category, e.g. 'Messaging', 'RPC'"),
    overview: z.string(),
    transport: z
        .string()
        .describe("Underlying transport, e.g. 'TCP', 'HTTP/2', 'UDP'"),
    communicationStyle: z
        .string()
        .describe(
            "e.g. 'Request-Response', 'Pub-Sub', 'Bi-directional Streaming'",
        ),
    useCases: z.array(z.string()),
    advantages: z.array(z.string()),
    disadvantages: z.array(z.string()),
    security: z.string(),
    relatedProtocols: z.array(z.string()),
});

// ── Top-Level AI Output ───────────────────────────────────────
export const AiArchitectureOutputSchema = z.object({
    name: z
        .string()
        .describe("Architecture name, e.g. 'E-Commerce Microservices Platform'"),
    description: z
        .string()
        .describe("Brief summary of the architecture design"),
    nodes: z
        .array(AiNodeSchema)
        .min(2)
        .describe(
            "All architecture nodes. Each must have realistic logicSteps.",
        ),
    edges: z
        .array(AiEdgeSchema)
        .min(1)
        .describe(
            "All connections between nodes with event names and protocols.",
        ),
    newTechnologies: z
        .array(AiNewTechnologySchema)
        .describe(
            "Technologies NOT in the existing library. Empty array if all tech exists.",
        ),
    newProtocols: z
        .array(AiNewProtocolSchema)
        .describe(
            "Protocols NOT in the existing library. Empty array if all protocols exist.",
        ),
});

// ── Inferred Types ────────────────────────────────────────────
export type AiLogicStep = z.infer<typeof AiLogicStepSchema>;
export type AiNode = z.infer<typeof AiNodeSchema>;
export type AiEdge = z.infer<typeof AiEdgeSchema>;
export type AiNewTechnology = z.infer<typeof AiNewTechnologySchema>;
export type AiNewProtocol = z.infer<typeof AiNewProtocolSchema>;
export type AiArchitectureOutput = z.infer<typeof AiArchitectureOutputSchema>;
