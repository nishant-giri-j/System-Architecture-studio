import re

with open('apps/web/app/api/ai/chaos-agent/route.ts', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace schema object using regex
schema_pattern = r"schema:\s*z\.object\(\{.*?(?=\s+\}\))"
new_schema = """schema: z.object({
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
                analysis: z.string().optional().describe("Detailed markdown report summarizing all experiments. Required if decision is CONCLUDE.")"""

code = re.sub(schema_pattern, new_schema, code, flags=re.DOTALL)

with open('apps/web/app/api/ai/chaos-agent/route.ts', 'w', encoding='utf-8') as f:
    f.write(code)
