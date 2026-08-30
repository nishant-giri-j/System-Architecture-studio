import { useState, useCallback } from "react";
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

    const resolveIssue = useCallback(async (warningId: string, warningText: string, nodeId?: string, onComplete?: (explanation: string) => void) => {
        setIsResolving(warningId);
        try {
            const enrichedWarning = nodeId ? `${warningText}\n\nTARGET NODE ID TO FIX: ${nodeId}` : warningText;
            const response = await fetch("/api/ai/auto-resolve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nodes, edges, warning: enrichedWarning }),
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || `API error: ${response.status}`);
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
            console.error("Auto-resolve failed:", error);
            alert("Failed to auto-resolve: " + (error as Error).message);
        } finally {
            setIsResolving(null);
        }
    }, [nodes, edges, setNodes, setEdges]);

    return {
        resolveIssue,
        isResolving
    };
}
