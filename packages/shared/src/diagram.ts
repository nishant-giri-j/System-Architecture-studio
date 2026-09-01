import type { LatencyWorkload } from './technology';

export type LogicCondition =
    | 'always'
    | 'on-hit'
    | 'on-miss'
    | 'on-success'
    | 'on-error';

export interface SystemWarning {
    id: string;
    type: 'deadlock' | 'starvation' | 'dropped' | 'unprogrammed' | 'wiring' | 'bottleneck' | 'cache-thrashing';
    message: string;
    nodeId?: string;
    timestamp: Date;
}

export interface NodeLatencyConfig {
    latencyProfileId?: string;
    latencyMultiplier?: number;
    cacheHitRate?: number;
    concurrency?: number;
    workload?: LatencyWorkload;
    networkHops?: number;
    nodeOverrideMs?: number;
}

export interface LogicStep {
    id: string;
    action: 'forward' | 'reply' | 'simulate-cache';
    targetNodeId?: string; // The ID of the connected node to route to
    condition: LogicCondition;
    hitRate?: number; // Only used for 'simulate-cache'
}

/** A persisted canvas is a pure data graph; UI-only state stays in the browser. */
export interface DiagramNode {
    id: string;
    type: 'architecture';
    position: { x: number; y: number };
    data: {
        label: string;
        technologyId: string;
        color: string;
        description?: string;
        logicSteps?: LogicStep[];
        processingDelay?: number;
        errorRate?: number;
        latency?: NodeLatencyConfig;
        routingStrategy?: 'broadcast' | 'load-balance';
    };
}

export interface DiagramEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
    data: {
        event: string;
        protocol?: string;
    };
}

export interface ArchitectureDiagram {
    id: string;
    name: string;
    version: 1;
    nodes: DiagramNode[];
    edges: DiagramEdge[];
    viewport: { x: number; y: number; zoom: number };
    updatedAt: string;
}

// ── API Payloads ────────────────────────────────────────────────

/** Viewport state for the React Flow canvas. */
export interface Viewport {
    x: number;
    y: number;
    zoom: number;
}

/** Input sent by the client when saving canvas state. */
export interface SaveProjectInput {
    /** Omit (or pass `undefined`) for a brand-new project. */
    projectId?: string;
    name: string;
    nodes: DiagramNode[];
    edges: DiagramEdge[];
    viewport: Viewport;
    /** Optimistic concurrency — send the last-known version. */
    version?: number;
}

/** Lightweight project summary for the "My Projects" list. */
export interface ProjectSummary {
    id: string;
    name: string;
    updatedAt: string;
}

/** Full project payload returned when loading a saved design. */
export interface ProjectState {
    id: string;
    name: string;
    nodes: DiagramNode[];
    edges: DiagramEdge[];
    viewport: Viewport;
    version: number;
    updatedAt: string;
}
