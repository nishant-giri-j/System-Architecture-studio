const fs = require("fs");
const content = fs.readFileSync("apps/web/hooks/use-simulation.ts", "utf8");

const replacement = `export interface SimulationMetrics {
    totalRequests: number;
    completedRequests: number;
    totalLatency: number;
    totalErrors: number;
    avgLatency: number;
}

export function useSimulation(`;

let updated = content.replace("export function useSimulation(", replacement);

const stateReplacement = `    const [logs, setLogs] = useState<SimulationLog[]>([]);
    const [metrics, setMetrics] = useState<SimulationMetrics>({
        totalRequests: 0,
        completedRequests: 0,
        totalLatency: 0,
        totalErrors: 0,
        avgLatency: 0,
    });
    
    // Store request start times
    const requestStartTimes = useRef<Record<string, number>>({});`;

updated = updated.replace("    const [logs, setLogs] = useState<SimulationLog[]>([]);", stateReplacement);

const returnReplacement = `    return { edgePulses, logs, metrics };
}`;
updated = updated.replace("    return { edgePulses, logs };\n}", returnReplacement);

fs.writeFileSync("apps/web/hooks/use-simulation.ts", updated);

