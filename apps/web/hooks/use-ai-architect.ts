"use client";

import { useState, useCallback, useRef } from "react";
import {
    type AiArchitectureOutput,
    type TechnologyDefinition,
    registerTechnology,
    registerProtocol,
} from "@architecture-studio/shared";
import type { ArchitectureFlowNode } from "../components/canvas/architecture-node";
import type { EventFlowEdge } from "../components/canvas/event-edge";
import { getLayoutedElements } from "../lib/auto-layout";

// ── Types ─────────────────────────────────────────────────────

export interface AiArchitectResult {
    nodes: ArchitectureFlowNode[];
    edges: EventFlowEdge[];
    name: string;
    description: string;
}

export interface UseAiArchitectReturn {
    generate: (
        prompt: string,
        technologies: TechnologyDefinition[],
    ) => Promise<AiArchitectResult | null>;
    cancelGeneration: () => void;
    isGenerating: boolean;
    progress: string;
    error: string | null;
    clearError: () => void;
}

// ── Hook ──────────────────────────────────────────────────────

export function useAiArchitect(): UseAiArchitectReturn {
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState("");
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const clearError = useCallback(() => setError(null), []);

    const cancelGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsGenerating(false);
        setProgress("");
    }, []);

    const generate = useCallback(
        async (
            prompt: string,
            technologies: TechnologyDefinition[],
        ): Promise<AiArchitectResult | null> => {
            cancelGeneration();
            setIsGenerating(true);
            setError(null);
            
            const abortController = new AbortController();
            abortControllerRef.current = abortController;

            try {
                // ── Step 1: Call the LLM API ──────────────────────
                setProgress("🧠 Analyzing your architecture requirements...");

                const response = await fetch("/api/ai/generate-architecture", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt }),
                    signal: abortController.signal,
                });

                if (!response.ok) {
                    const err = await response.json().catch(() => ({}));
                    throw new Error(
                        err.error || `API error: ${response.status}`,
                    );
                }

                const result: AiArchitectureOutput = await response.json();

                // ── Step 2: Persist new tech/protocols permanently ──
                if (
                    result.newTechnologies.length > 0 ||
                    result.newProtocols.length > 0
                ) {
                    setProgress(
                        "💾 Saving new technologies to library...",
                    );

                    // Register at runtime immediately
                    for (const newTech of result.newTechnologies) {
                        registerTechnology({
                            id: newTech.id,
                            label: newTech.label,
                            category: newTech.category,
                            color: newTech.color,
                            description: newTech.description,
                        });
                    }

                    for (const newProto of result.newProtocols) {
                        registerProtocol({
                            id: newProto.id,
                            label: newProto.label,
                            category: newProto.category,
                            overview: newProto.overview,
                            transport: newProto.transport,
                            communicationStyle: newProto.communicationStyle,
                            useCases: newProto.useCases,
                            advantages: newProto.advantages,
                            disadvantages: newProto.disadvantages,
                            security: newProto.security,
                            relatedProtocols: newProto.relatedProtocols,
                        });
                    }

                    // Persist to source files (fire and forget — don't block canvas)
                    fetch("/api/ai/persist-library", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            technologies: result.newTechnologies,
                            protocols: result.newProtocols,
                        }),
                    }).catch((err) =>
                        console.warn("Library persistence failed:", err),
                    );
                }

                // ── Step 3: Convert AI nodes → DiagramNodes ──────
                setProgress("📐 Building architecture on canvas...");

                const flowNodes: ArchitectureFlowNode[] = result.nodes.map(
                    (aiNode) => ({
                        id: aiNode.id,
                        type: "architecture" as const,
                        position: { x: 0, y: 0 }, // dagre will position
                        data: {
                            label: aiNode.label,
                            technologyId: aiNode.technologyId,
                            color: aiNode.color,
                            description: aiNode.description,
                            logicSteps: aiNode.logicSteps.map((step) => ({
                                id: crypto.randomUUID(),
                                action: step.action,
                                targetNodeId: step.targetNodeId,
                                condition: step.condition,
                                hitRate: step.hitRate,
                            })),
                            processingDelay: aiNode.processingDelay ?? 0,
                            routingStrategy: aiNode.routingStrategy ?? "broadcast",
                            hardware: aiNode.hardware ? {
                                cpuCores: aiNode.hardware.cpuCores,
                                memoryMb: aiNode.hardware.memoryMb
                            } : undefined,
                            bandwidthCapacity: aiNode.bandwidthCapacity,
                            latency: aiNode.latency ? {
                                latencyMultiplier: aiNode.latency.latencyMultiplier,
                                cacheHitRate: aiNode.latency.cacheHitRate,
                                concurrency: aiNode.latency.concurrency,
                                workload: aiNode.latency.workload,
                                networkHops: aiNode.latency.networkHops,
                                nodeOverrideMs: aiNode.latency.nodeOverrideMs
                            } : undefined,
                        },
                    }),
                );

                // ── Step 4: Convert AI edges → EventFlowEdges ───
                const flowEdges: EventFlowEdge[] = result.edges.map(
                    (aiEdge) => ({
                        id: aiEdge.id,
                        source: aiEdge.sourceNodeId,
                        target: aiEdge.targetNodeId,
                        type: "event" as const,
                        markerEnd: {
                            type: 'arrowclosed' as any, // MarkerType.ArrowClosed is just string
                            width: 16,
                            height: 16,
                            color: '#161616',
                        },
                        data: {
                            event: aiEdge.event,
                            protocol: aiEdge.protocol,
                            edgeStyle: aiEdge.edgeStyle ?? "bezier",
                        },
                    }),
                );

                // ── Step 5: Auto-layout with dagre ──────────────
                setProgress("✨ Laying out architecture...");

                const { nodes: layoutedNodes, edges: layoutedEdges } =
                    getLayoutedElements(flowNodes, flowEdges, "LR");

                setProgress("✅ Architecture generated!");

                return {
                    nodes: layoutedNodes as ArchitectureFlowNode[],
                    edges: layoutedEdges as EventFlowEdge[],
                    name: result.name,
                    description: result.description,
                };
            } catch (err: any) {
                if (err.name === 'AbortError') {
                    return null;
                }
                const message =
                    err instanceof Error
                        ? err.message
                        : "An unexpected error occurred";
                setError(message);
                throw err;
            } finally {
                if (abortControllerRef.current === abortController) {
                    setIsGenerating(false);
                    abortControllerRef.current = null;
                }
            }
        },
        [cancelGeneration],
    );

    return { generate, cancelGeneration, isGenerating, progress, error, clearError };
}
