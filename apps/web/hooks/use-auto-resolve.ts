import { useState, useCallback, useRef } from "react";
import type { ArchitectureFlowNode } from "../components/canvas/architecture-node";
import type { EventFlowEdge } from "../components/canvas/event-edge";


export interface AutoResolveResult {
    nodesToUpdate: { id: string; patch: any }[];
    nodesToAdd: any[];
    edgesToAdd: any[];
    edgesToDelete: string[];
    nodesToDelete: string[];
    explanation: string;
}

export function useAutoResolve(
    nodes: ArchitectureFlowNode[],
    edges: EventFlowEdge[],
    setNodes: any,
    setEdges: any
) {
    const [isResolving, setIsResolving] = useState<string | null>(null); // Store the warning ID being resolved
    const abortControllerRef = useRef<AbortController | null>(null);

    const cancelResolve = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsResolving(null);
    }, []);

    const resolveIssue = useCallback(async (warningId: string, warningText: string, nodeId?: string, onComplete?: (explanation: string) => void) => {
        setIsResolving(warningId);
        const controller = new AbortController();
        abortControllerRef.current = controller;
        try {
            const enrichedWarning = nodeId ? `${warningText}\n\nTARGET NODE ID TO FIX: ${nodeId}` : warningText;
            
            let attempt = 0;
            const maxRetries = 2;
            let response: Response | null = null;

            while (attempt <= maxRetries) {
                response = await fetch("/api/ai/auto-resolve", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ nodes, edges, warning: enrichedWarning }),
                    signal: controller.signal,
                });

                if (response.ok) break;

                // If 503 or 429, retry
                if (response.status === 503 || response.status === 429 || response.status >= 500) {
                    attempt++;
                    if (attempt > maxRetries) break;
                    await new Promise(r => setTimeout(r, 1500 * attempt));
                    continue;
                }
                break;
            }

            if (!response || !response.ok) {
                const err = await response?.json().catch(() => ({})) || {};
                throw new Error(err.error || `API error: ${response?.status}`);
            }

            const patch: AutoResolveResult = await response.json();

            // 1. Compute new edges
            let newEdges = [...edges];
            newEdges = newEdges.filter(e => !patch.edgesToDelete.includes(e.id));
            
            // Note: edges connected to deleted nodes must be removed
            newEdges = newEdges.filter(e => !patch.nodesToDelete.includes(e.source) && !patch.nodesToDelete.includes(e.target));

            patch.edgesToAdd.forEach(newEdge => {
                newEdges.push({
                    id: newEdge.id,
                    source: newEdge.source,
                    target: newEdge.target,
                    type: 'event',
                    markerEnd: {
                        type: 'arrowclosed' as any,
                        width: 16,
                        height: 16,
                        color: '#161616',
                    },
                    data: {
                        event: newEdge.event || 'Forward',
                        protocol: newEdge.protocol || 'HTTP',
                        edgeStyle: 'bezier',
                    }
                });
            });

            // 2. Compute new nodes
            let newNodes = [...nodes];
            newNodes = newNodes.filter(n => !patch.nodesToDelete.includes(n.id));

            newNodes = newNodes.map(node => {
                const update = patch.nodesToUpdate.find(u => u.id === node.id);
                if (update) {
                    const p = update.patch;
                    // Build the latency sub-object patch for fields that live inside node.data.latency
                    const latencyPatch: Record<string, any> = {};
                    if (p.concurrency !== undefined) latencyPatch.concurrency = p.concurrency;
                    if (p.cacheHitRate !== undefined) latencyPatch.cacheHitRate = p.cacheHitRate;
                    if (p.latencyMultiplier !== undefined) latencyPatch.latencyMultiplier = p.latencyMultiplier;

                    return {
                        ...node,
                        data: {
                            ...node.data,
                            // Direct data-level fields
                            ...(p.label !== undefined && { label: p.label }),
                            ...(p.technologyId !== undefined && { technologyId: p.technologyId }),
                            ...(p.processingDelay !== undefined && { processingDelay: p.processingDelay }),
                            ...(p.logicSteps !== undefined && { logicSteps: p.logicSteps }),
                            ...(p.hardware !== undefined && { hardware: p.hardware }),
                            ...(p.bandwidthCapacity !== undefined && { bandwidthCapacity: p.bandwidthCapacity }),
                            // Nested latency fields
                            ...(Object.keys(latencyPatch).length > 0 && {
                                latency: {
                                    ...(node.data as any).latency,
                                    ...latencyPatch,
                                }
                            }),
                        }
                    };
                }
                return node;
            });

            patch.nodesToAdd.forEach((newNode, idx) => {
                newNodes.push({
                    id: newNode.id,
                    type: 'architecture',
                    // Spawn near the middle of the canvas with a slight offset if multiple nodes are added
                    position: { x: 400 + (idx * 50), y: 300 + (idx * 50) },
                    data: {
                        label: newNode.label,
                        technologyId: newNode.technologyId,
                        color: newNode.color || '#ffffff',
                        logicSteps: newNode.logicSteps || [],
                        processingDelay: newNode.processingDelay || 0,
                        ...(newNode.hardware !== undefined && { hardware: newNode.hardware }),
                        ...(newNode.bandwidthCapacity !== undefined && { bandwidthCapacity: newNode.bandwidthCapacity }),
                        latency: {
                            concurrency: newNode.concurrency || 1,
                        },
                    }
                });
            });

            // 3. Update state WITHOUT changing the user's manual layout
            setNodes(newNodes);
            setEdges(newEdges);
            
            if (onComplete) {
                onComplete(patch.explanation);
            }

        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                // User cancelled — do nothing
                return;
            }
            console.error("Auto-resolve failed:", error);
            alert("Failed to auto-resolve: " + (error as Error).message);
        } finally {
            abortControllerRef.current = null;
            setIsResolving(null);
        }
    }, [nodes, edges, setNodes, setEdges]);

    return {
        resolveIssue,
        isResolving,
        cancelResolve
    };
}
