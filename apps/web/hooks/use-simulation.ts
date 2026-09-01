import {
    resolveLatencyProfile,
    type LatencyWorkload,
    type LogicStep,
    type SystemWarning,
    type TechnologyDefinition,
} from '@architecture-studio/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ArchitectureFlowNode } from '../components/canvas/architecture-node';
import type { EventFlowEdge } from '../components/canvas/event-edge';

export type PulseType = 'request' | 'response' | 'cache-miss' | 'cache-save';

export interface InternalPulse {
    id: string;
    edgeId: string;
    sourceNodeId: string;
    targetNodeId: string;
    reverse: boolean;
    type: PulseType;
    color: string;
    requestId: string;
    callerId?: string;
    createdAt?: number;
    travelDurationMs?: number;
    statusCode?: number;
    size?: number; // payload size (visual width)
    protocol?: string; // HTTP, SQL, GRPC, WebSocket
}

const PULSE_LOGIC_DURATION = 960;
const PULSE_VISUAL_DURATION = 1000;

export interface SimulationLog {
    id: string;
    sequence: number;
    simulatedAt: number;
    requestId?: string;
    nodeId?: string;
    eventType:
        | 'request'
        | 'processing'
        | 'forward'
        | 'response'
        | 'cache'
        | 'error'
        | 'system';
    durationMs?: number;
    message: string;
    color: string;
    timestamp: Date;
}

export interface SimulationMetrics {
    totalRequests: number;
    completedRequests: number;
    totalLatency: number;
    totalErrors: number;
    avgLatency: number;
    p50Latency: number;
    p95Latency: number;
    p99Latency: number;
    latencyBreakdown: Record<string, number>;
    inFlightRequests: number;
    droppedRequests: number;
    throughputPerSecond: number;
    statusCodes: Record<number, number>;
}

export type RequestLifecycle =
    | 'created'
    | 'processing'
    | 'waiting'
    | 'completed'
    | 'failed'
    | 'cancelled';

interface RequestLatency {
    total: number;
    breakdown: Record<string, number>;
    lifecycle: RequestLifecycle;
    startedAt: number;
    expectedResponses: number;
    receivedResponses: number;
}

interface ScheduledSimulationEvent {
    at: number;
    sequence: number;
    callback: () => void;
}

interface BranchJoinState {
    expected: number;
    completed: number;
    hasFailed?: boolean;
}

function deterministicSample(value: string): number {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0) / 4294967296;
}

export function useSimulation(
    nodes: ArchitectureFlowNode[],
    edges: EventFlowEdge[],
    isPlaying: boolean,
    isPaused: boolean = false,
    technologies: TechnologyDefinition[],
    singleCycle: boolean = false,
    playbackSpeed: number = 1,
    requestsPerSecond: number = 0.83,
    maxInFlight: number = Infinity,
    totalLimit: number = Infinity,
    onWarning?: (warning: SystemWarning) => void,
    onSimulationComplete?: () => void,
) {
    const [edgePulses, setEdgePulses] = useState<
        Record<string, InternalPulse[]>
    >({});
    const [logs, setLogs] = useState<SimulationLog[]>([]);
    const [metrics, setMetrics] = useState<SimulationMetrics>({
        totalRequests: 0,
        completedRequests: 0,
        totalLatency: 0,
        totalErrors: 0,
        avgLatency: 0,
        p50Latency: 0,
        p95Latency: 0,
        p99Latency: 0,
        latencyBreakdown: {},
        inFlightRequests: 0,
        droppedRequests: 0,
        throughputPerSecond: 0,
        statusCodes: {},
    });

    const requestLatencies = useRef<Record<string, RequestLatency>>({});
    const latencySamples = useRef<number[]>([]);

    const hasCompletedRef = useRef(false);

    const updateMetricsNow = useCallback((updater: (m: SimulationMetrics) => SimulationMetrics) => {
        metricsRef.current = updater(metricsRef.current);
        setMetrics(metricsRef.current);

        if (
            !hasCompletedRef.current &&
            totalLimitRef.current < Infinity &&
            metricsRef.current.totalRequests >= totalLimitRef.current &&
            metricsRef.current.inFlightRequests === 0
        ) {
            hasCompletedRef.current = true;
            if (onSimulationComplete) {
                onSimulationComplete();
            }
        }
    }, [onSimulationComplete]);
    const simulationClock = useRef(0);
    const logSequence = useRef(0);
    const eventSequence = useRef(0);
    const eventQueue = useRef<ScheduledSimulationEvent[]>([]);
    const branchJoins = useRef<Record<string, BranchJoinState>>({});
    const requestSequence = useRef(0);
    const completedAt = useRef<number[]>([]);
    const [bottleneckNodes, setBottleneckNodes] = useState<Set<string>>(
        new Set(),
    );
    const [nodeQueues, setNodeQueues] = useState<Record<string, { pulse: InternalPulse }[]>>({});
    const [frozenNodes, setFrozenNodes] = useState<Set<string>>(new Set());
    const [offlineNodes, setOfflineNodes] = useState<Set<string>>(new Set());
    
    interface QueueTask {
        pulse: InternalPulse;
        execute: () => void;
        delay: number;
    }
    const nodeQueuesRef = useRef<Record<string, QueueTask[]>>({});
    const nodeProcessingCount = useRef<Record<string, number>>({});
    const frozenNodesRef = useRef<Set<string>>(new Set());
    const offlineNodesRef = useRef<Set<string>>(new Set());
    const cacheState = useRef<Record<string, Set<number>>>({});

    const addLog = useCallback(
        (
            message: string,
            color: string,
            context?: Partial<
                Omit<SimulationLog, 'id' | 'message' | 'color' | 'timestamp'>
            >,
        ) => {
            const sequence = ++logSequence.current;
            setLogs((prev) => {
                const newLog = {
                    id: crypto.randomUUID(),
                    sequence,
                    simulatedAt: Math.round(simulationClock.current),
                    eventType: context?.eventType ?? 'system',
                    message,
                    color,
                    timestamp: new Date(),
                    ...context,
                };
                return [...prev, newLog].slice(-500);
            });
        },
        [],
    );

    const nodesRef = useRef(nodes);
    const edgesRef = useRef(edges);
    const techsRef = useRef(technologies);
    const isPlayingRef = useRef(isPlaying);
    const isPausedRef = useRef(isPaused);
    const maxInFlightRef = useRef(maxInFlight);
    const totalLimitRef = useRef(totalLimit);
    const requestsPerSecondRef = useRef(requestsPerSecond);
    const warnedNodesRef = useRef<Set<string>>(new Set());
    const inFlightLb = useRef<Record<string, string[]>>({});
    const metricsRef = useRef(metrics);

    useEffect(() => {
        nodesRef.current = nodes;
        edgesRef.current = edges;
        techsRef.current = technologies;
        isPlayingRef.current = isPlaying;
        isPausedRef.current = isPaused;
        maxInFlightRef.current = maxInFlight;
        totalLimitRef.current = totalLimit;
        requestsPerSecondRef.current = requestsPerSecond;
        metricsRef.current = metrics;
    }, [nodes, edges, technologies, isPlaying, isPaused, metrics, maxInFlight, totalLimit, requestsPerSecond]);

    useEffect(() => {
        if (isPlaying && onWarning && !warnedNodesRef.current.has('wiring-checked')) {
            warnedNodesRef.current.add('wiring-checked');
            
            edges.forEach(edge => {
                const source = nodes.find(n => n.id === edge.source);
                const target = nodes.find(n => n.id === edge.target);
                if (source && target) {
                    const sourceTech = technologies.find(t => t.id === source.data.technologyId);
                    const targetTech = technologies.find(t => t.id === target.data.technologyId);
                    
                    if (sourceTech?.category === 'client' && targetTech?.category === 'data') {
                        onWarning({
                            id: crypto.randomUUID(),
                            type: 'wiring',
                            message: `Client '${source.data.label}' is connected directly to Database '${target.data.label}'. Use an API Gateway!`,
                            timestamp: new Date()
                        });
                    }
                    if (sourceTech?.category === 'messaging' && targetTech?.category === 'data') {
                        onWarning({
                            id: crypto.randomUUID(),
                            type: 'wiring',
                            message: `Queue '${source.data.label}' is connected directly to Database '${target.data.label}'. Use a worker service!`,
                            timestamp: new Date()
                        });
                    }
                }
            });
        }
    }, [isPlaying, nodes, edges, technologies, onWarning]);

    const createPausableTimeout = useCallback(
        (cb: () => void, delay: number) => {
            eventQueue.current.push({
                at: simulationClock.current + Math.max(0, delay),
                sequence: ++eventSequence.current,
                callback: cb,
            });
            eventQueue.current.sort(
                (first, second) =>
                    first.at - second.at || first.sequence - second.sequence,
            );
        },
        [],
    );

    const stepEvent = useCallback(() => {
        if (!isPlayingRef.current || !isPausedRef.current) return false;
        const event = eventQueue.current.shift();
        if (!event) return false;
        simulationClock.current = Math.max(simulationClock.current, event.at);
        event.callback();
        return true;
    }, []);

    useEffect(() => {
        if (!isPlaying) {
            eventQueue.current = [];
            simulationClock.current = 0;
            return;
        }

        let active = true;
        let lastWallClock = Date.now();
        const tick = () => {
            if (!active || !isPlayingRef.current) return;
            const now = Date.now();
            if (!isPausedRef.current) {
                simulationClock.current +=
                    (now - lastWallClock) * Math.max(0.1, playbackSpeed);
                let nextEvent = eventQueue.current[0];
                while (nextEvent && nextEvent.at <= simulationClock.current) {
                    const event = eventQueue.current.shift();
                    event?.callback();
                    nextEvent = eventQueue.current[0];
                }
            }
            lastWallClock = now;
            if (active) window.setTimeout(tick, 16);
        };
        window.setTimeout(tick, 16);

        return () => {
            active = false;
        };
    }, [isPlaying, playbackSpeed]);

    const emitPulse = useCallback(
        (pulse: InternalPulse) => {
            const timedPulse = {
                ...pulse,
                createdAt: pulse.createdAt ?? simulationClock.current,
                travelDurationMs:
                    pulse.travelDurationMs ?? PULSE_LOGIC_DURATION,
            };
            setEdgePulses((prev) => {
                const current = prev[timedPulse.edgeId] || [];
                return {
                    ...prev,
                    [timedPulse.edgeId]: [...current, timedPulse],
                };
            });

            createPausableTimeout(() => {
                if (isPlayingRef.current) {
                    handleArrivalRef.current(timedPulse);
                }
            }, timedPulse.travelDurationMs);

            createPausableTimeout(
                () => {
                    setEdgePulses((prev) => {
                        const current = prev[timedPulse.edgeId] || [];
                        return {
                            ...prev,
                            [timedPulse.edgeId]: current.filter(
                                (p) => p.id !== timedPulse.id,
                            ),
                        };
                    });
                },
                Math.max(PULSE_VISUAL_DURATION, timedPulse.travelDurationMs),
            );
        },
        [createPausableTimeout],
    );

    const handleArrivalRef = useRef<(pulse: InternalPulse) => void>(() => {});

    const estimateNodeLatency = useCallback(
        (
            node: ArchitectureFlowNode,
            tech: TechnologyDefinition,
            pulseType: PulseType,
        ) => {
            const profile = resolveLatencyProfile(tech);
            const config = node.data.latency || {};
            const workloadFactors: Record<LatencyWorkload, number> = {
                light: 0.75,
                normal: 1,
                heavy: 1.6,
            };
            const workloadFactor = workloadFactors[config.workload || 'normal'];
            const concurrencyFactor =
                1 +
                Math.min(3, Math.max(0, (config.concurrency || 1) - 1) * 0.04);
            const hasCacheLogic = (node.data.logicSteps || []).some(s => s.action === 'simulate-cache');
            const isCache = tech.category === 'cache' || hasCacheLogic;
            const cacheCost =
                isCache
                    ? (profile.cacheHitMs * (config.cacheHitRate ?? 80) +
                          profile.cacheMissMs *
                              (100 - (config.cacheHitRate ?? 80))) /
                      100
                    : 0;
            const operationCost =
                tech.category === 'data' || tech.category === 'storage'
                    ? profile.readMs
                    : 0;
            const asyncCost =
                tech.category === 'messaging' ? profile.asyncMs : 0;
            const responseCost =
                pulseType === 'response'
                    ? 0
                    : profile.baseMs + operationCost + cacheCost + asyncCost;
            return Math.max(
                1,
                Math.round(
                    (responseCost +
                        profile.networkHopMs * (config.networkHops ?? 1)) *
                        workloadFactor *
                        concurrencyFactor *
                        (config.latencyMultiplier ?? 1) +
                        (config.nodeOverrideMs ?? 0) +
                        (node.data.processingDelay ?? 0),
                ),
            );
        },
        [],
    );

    const processQueue = useCallback((nodeId: string, tech: TechnologyDefinition) => {
        if (frozenNodesRef.current.has(nodeId)) return;
        
        const q = nodeQueuesRef.current[nodeId];
        if (!q || q.length === 0) return;
        
        let concurrencyLimit = 10;
        if (tech.category === 'client') concurrencyLimit = Infinity;
        else if (tech.category === 'data') concurrencyLimit = 10;
        else if (tech.category === 'cache') concurrencyLimit = 50;
        else if (tech.category === 'messaging') concurrencyLimit = 500;
        else if (tech.category === 'storage') concurrencyLimit = 20;

        const processing = nodeProcessingCount.current[nodeId] || 0;
        if (processing >= concurrencyLimit) return;
        
        const task = q.shift();
        if (!task) return;
        
        nodeProcessingCount.current[nodeId] = processing + 1;
        
        // Trigger React state update for visual queues
        setNodeQueues((prev) => ({
            ...prev,
            [nodeId]: q.map(t => ({ pulse: t.pulse }))
        }));

        createPausableTimeout(() => {
            task.execute();
            nodeProcessingCount.current[nodeId] = Math.max(0, (nodeProcessingCount.current[nodeId] || 1) - 1);
            processQueue(nodeId, tech);
        }, task.delay);
    }, [createPausableTimeout]);

    const handleArrival = useCallback(
        (pulse: InternalPulse) => {
            const arrivedAtId = pulse.reverse
                ? pulse.sourceNodeId
                : pulse.targetNodeId;
            const node = nodesRef.current.find((n) => n.id === arrivedAtId);
            if (!node) return;

            let tech = techsRef.current.find(
                (t) => t.id === node.data.technologyId,
            );
            
            if (!tech) {
                tech = {
                    id: node.data.technologyId,
                    label: node.data.label,
                    category: 'service',
                    color: node.data.color,
                    description: node.data.description || 'Unknown AI node',
                };
            }

            const reply = (
                type: PulseType,
                color: string,
                specificCaller?: string,
                statusCode?: number,
                protocol?: string,
                size?: number,
            ) => {
                const targetCaller = specificCaller || pulse.callerId;
                if (!targetCaller) return;

                const edge = edgesRef.current.find(
                    (e) =>
                        (e.source === arrivedAtId &&
                            e.target === targetCaller) ||
                        (e.target === arrivedAtId &&
                            e.source === targetCaller),
                );
                if (!edge) return;
                
                const defaultSize = type === 'response' ? 40 + Math.random() * 80 : 30;

                emitPulse({
                    id: crypto.randomUUID(),
                    edgeId: edge.id,
                    sourceNodeId: edge.source,
                    targetNodeId: edge.target,
                    reverse: edge.target === targetCaller ? false : true,
                    type,
                    color,
                    requestId: pulse.requestId,
                    callerId: arrivedAtId,
                    statusCode,
                    protocol: protocol || edge.data?.protocol || 'HTTP',
                    size: size || defaultSize,
                });
            };

            if (offlineNodesRef.current.has(node.id) && pulse.type === 'request') {
                updateMetricsNow((m) => ({ ...m, droppedRequests: m.droppedRequests + 1, totalErrors: m.totalErrors + 1 }));
                addLog(`[${node.data.label}] Node is OFFLINE! (502 Bad Gateway)`, '#ff6b6b', {
                    eventType: 'error',
                    requestId: pulse.requestId,
                    nodeId: node.id,
                });
                if (pulse.callerId) {
                    reply('cache-miss', '#ff6b6b', pulse.callerId, 502);
                } else {
                    // It was a direct client request that failed instantly. Decrement in-flight.
                    updateMetricsNow(m => ({ ...m, inFlightRequests: Math.max(0, m.inFlightRequests - 1), completedRequests: m.completedRequests + 1 }));
                    const req = requestLatencies.current[pulse.requestId];
                    if (req) {
                        req.lifecycle = 'failed';
                        delete requestLatencies.current[pulse.requestId];
                    }
                }
                return;
            }

            const modeledLatency = estimateNodeLatency(node, tech, pulse.type);
            
            const baseDelay = Math.max(
                35,
                Math.round(modeledLatency * 0.25) +
                    Math.round((node.data.processingDelay || 0) * 0.2),
            );
            
            const delay = Math.min(1400, baseDelay);

            const executeLogic = () => {
                if (!isPlayingRef.current) return;
                
                if (offlineNodesRef.current.has(node.id) && pulse.type === 'request') {
                    updateMetricsNow((m) => ({ ...m, droppedRequests: m.droppedRequests + 1, totalErrors: m.totalErrors + 1 }));
                    addLog(`[${node.data.label}] Node went OFFLINE while in queue! (502)`, '#ff6b6b', {
                        eventType: 'error',
                        requestId: pulse.requestId,
                        nodeId: node.id,
                    });
                    if (pulse.callerId) {
                        reply('cache-miss', '#ff6b6b', pulse.callerId, 502);
                    } else {
                        updateMetricsNow(m => ({ ...m, inFlightRequests: Math.max(0, m.inFlightRequests - 1), completedRequests: m.completedRequests + 1 }));
                        const req = requestLatencies.current[pulse.requestId];
                        if (req) {
                            req.lifecycle = 'failed';
                            delete requestLatencies.current[pulse.requestId];
                        }
                    }
                    return;
                }
                
                const trace = (
                    message: string,
                    color: string,
                    eventType: SimulationLog['eventType'],
                    durationMs = modeledLatency,
                ) =>
                    addLog(message, color, {
                        eventType,
                        durationMs,
                        requestId: pulse.requestId,
                        nodeId: node.id,
                    });
                if (pulse.type === 'request') {
                    const request = requestLatencies.current[
                        pulse.requestId
                    ] || {
                        total: 0,
                        breakdown: {} as Record<string, number>,
                        lifecycle: 'processing',
                        startedAt: simulationClock.current,
                        expectedResponses: 1,
                        receivedResponses: 0,
                    };
                    request.lifecycle = 'processing';
                    request.total += modeledLatency;
                    request.breakdown[node.data.label] =
                        (request.breakdown[node.data.label] || 0) +
                        modeledLatency;
                    requestLatencies.current[pulse.requestId] = request;
                }
                const outgoingEdges = edgesRef.current.filter(
                    (e) => e.source === arrivedAtId,
                );



                const forward = (
                    edge: EventFlowEdge,
                    type: PulseType,
                    color: string,
                    statusCode?: number,
                    protocol?: string,
                    size?: number,
                ) => {
                    const defaultSize = type === 'request' ? 30 + Math.random() * 40 : 40 + Math.random() * 80;

                    emitPulse({
                        id: crypto.randomUUID(),
                        edgeId: edge.id,
                        sourceNodeId: node.id,
                        targetNodeId: edge.target,
                        reverse: false,
                        type,
                        color,
                        requestId: pulse.requestId,
                        callerId: arrivedAtId,
                        protocol: protocol || edge.data?.protocol || 'HTTP',
                        size: size || defaultSize,
                    });
                };

                if (tech.category === 'client') {
                    if (pulse.type === 'request') {
                        if (outgoingEdges.length > 0) {
                            requestLatencies.current[pulse.requestId] = {
                                total: 0,
                                breakdown: {},
                                lifecycle: 'created',
                                startedAt: simulationClock.current,
                                expectedResponses: outgoingEdges.length,
                                receivedResponses: 0,
                            };
                            outgoingEdges.forEach((edge) =>
                                forward(edge, 'request', '#ffde59'),
                            );
                        } else {
                            delete requestLatencies.current[pulse.requestId];
                        }
                    } else if (
                        pulse.type === 'response' ||
                        pulse.type === 'cache-miss'
                    ) {
                        const isError = pulse.type === 'cache-miss';
                        const color = isError ? '#ff6b6b' : '#9cf57a';
                        const msg = isError
                            ? 'Received error response.'
                            : 'Received final response successfully.';
                        addLog(`[${node.data.label}] ${msg}`, color);

                        const request =
                            requestLatencies.current[pulse.requestId];
                        if (request) {
                            request.receivedResponses += 1;
                            const isLastResponse = request.receivedResponses >= request.expectedResponses;
                            
                            if (isLastResponse) {
                                // All wire-level responses have arrived for this user action.
                                // Now record final latency and decrement in-flight.
                                const latency = request.total;
                                latencySamples.current = [
                                    ...latencySamples.current,
                                    latency,
                                ].slice(-100);
                                const sortedSamples = [
                                    ...latencySamples.current,
                                ].sort((a, b) => a - b);
                                const p95Index = Math.max(
                                    0,
                                    Math.ceil(sortedSamples.length * 0.95) - 1,
                                );
                                const p50Index = Math.max(
                                    0,
                                    Math.ceil(sortedSamples.length * 0.5) - 1,
                                );
                                const p99Index = Math.max(
                                    0,
                                    Math.ceil(sortedSamples.length * 0.99) - 1,
                                );
                                completedAt.current.push(simulationClock.current);
                                updateMetricsNow((m) => {
                                    const newTotal = m.totalLatency + latency;
                                    const newCompleted = m.completedRequests + 1;
                                    const code = pulse.statusCode || (isError ? 500 : 200);
                                    const newErrors = m.totalErrors + (code >= 400 ? 1 : 0);
                                    const breakdown = { ...m.latencyBreakdown };
                                    Object.entries(request.breakdown).forEach(([label, value]) => {
                                        breakdown[label] = (breakdown[label] || 0) + value;
                                    });
                                    const newStatusCodes = { ...m.statusCodes };
                                    newStatusCodes[code] = (newStatusCodes[code] || 0) + 1;
                                    return {
                                        ...m,
                                        statusCodes: newStatusCodes,
                                        completedRequests: newCompleted,
                                        totalLatency: newTotal,
                                        totalErrors: newErrors,
                                        avgLatency: Math.round(newTotal / newCompleted),
                                        p50Latency: sortedSamples[p50Index] || latency,
                                        p95Latency: sortedSamples[p95Index] || latency,
                                        p99Latency: sortedSamples[p99Index] || latency,
                                        latencyBreakdown: breakdown,
                                        inFlightRequests: Math.max(0, m.inFlightRequests - 1),
                                        throughputPerSecond: completedAt.current.length,
                                    };
                                });
                                delete requestLatencies.current[pulse.requestId];
                            }
                        }
                    }
                } else {
                    const logicSteps = node.data.logicSteps || [];
                    const hasLogic = logicSteps.length > 0;
                    
                    if (pulse.type === 'request') {
                        if (pulse.callerId) {
                            const key = `${arrivedAtId}_${pulse.requestId}`;
                            const callers = inFlightLb.current[key] || [];
                            
                            // Check for true A -> B -> A infinite loop (deadlock)
                            let isDeadlock = false;
                            const visited = new Set<string>();
                            const checkQueue = [pulse.callerId];
                            while (checkQueue.length > 0) {
                                const curr = checkQueue.shift()!;
                                if (curr === arrivedAtId) {
                                    isDeadlock = true;
                                    break;
                                }
                                if (visited.has(curr)) continue;
                                visited.add(curr);
                                const upstreamCallers = inFlightLb.current[`${curr}_${pulse.requestId}`] || [];
                                checkQueue.push(...upstreamCallers);
                            }

                            if (isDeadlock) {
                                if (!warnedNodesRef.current.has(`${pulse.requestId}-deadlock`)) {
                                    warnedNodesRef.current.add(`${pulse.requestId}-deadlock`);
                                    if (onWarning) onWarning({ id: crypto.randomUUID(), type: 'deadlock', message: `Deadlock Detected: Infinite routing loop involving ${node.data.label}! Packet dropped.`, timestamp: new Date(), nodeId: node.id });
                                }
                                updateMetricsNow((m) => ({ ...m, droppedRequests: m.droppedRequests + 1, totalErrors: m.totalErrors + 1 }));
                                reply('cache-miss', '#ff6b6b', pulse.callerId, 508); // 508 Loop Detected
                                return; 
                            }
                        }

                        const qLen = nodeQueuesRef.current[node.id]?.length || 0;
                        if (qLen > 15 && !warnedNodesRef.current.has(`${node.id}-starved`)) {
                            warnedNodesRef.current.add(`${node.id}-starved`);
                            if (onWarning) onWarning({ id: crypto.randomUUID(), type: 'starvation', message: `Starvation Alert: ${node.data.label} is overwhelmed (Queue: ${qLen})! Processing delay is too high for this traffic rate.`, timestamp: new Date(), nodeId: node.id });
                        }

                        if (!hasLogic) {
                            if (!warnedNodesRef.current.has(node.id)) {
                                warnedNodesRef.current.add(node.id);
                                if (onWarning) {
                                    onWarning({ id: crypto.randomUUID(), type: 'unprogrammed', message: `Missing Logic: ${node.data.label} dropped a packet because it hasn't been programmed in the Logic Panel yet.`, timestamp: new Date(), nodeId: node.id });
                                }
                            }
                            trace(`[${tech.label}] Packet dropped (No Logic)`, '#ff6b6b', 'error');
                            updateMetricsNow((m) => ({ ...m, droppedRequests: m.droppedRequests + 1, totalErrors: m.totalErrors + 1 }));
                            if (pulse.callerId) {
                                reply('cache-miss', '#ff6b6b', pulse.callerId, 500);
                            } else {
                                updateMetricsNow(m => ({ ...m, inFlightRequests: Math.max(0, m.inFlightRequests - 1), completedRequests: m.completedRequests + 1 }));
                                const req = requestLatencies.current[pulse.requestId];
                                if (req) {
                                    req.lifecycle = 'failed';
                                    delete requestLatencies.current[pulse.requestId];
                                }
                            }
                            return;
                        }

                        trace(`[${tech.label}] Processing request`, '#ffde59', 'processing');
                        
                        if (pulse.callerId) {
                            const key = `${arrivedAtId}_${pulse.requestId}`;
                            const callers = inFlightLb.current[key] || [];
                            inFlightLb.current[key] = [...callers, pulse.callerId];
                        }

                        const executeSteps = (conditions: Set<string>) => {
                            const stepsToRun = logicSteps.filter(s => conditions.has(s.condition));
                            const forwardSteps: typeof logicSteps = [];
                            stepsToRun.forEach(s => {
                                if (s.action === 'forward' && s.targetNodeId) {
                                    if (outgoingEdges.some(e => e.target === s.targetNodeId)) {
                                        forwardSteps.push(s);
                                    } else {
                                        if (!warnedNodesRef.current.has(`${node.id}-broken-route`)) {
                                            warnedNodesRef.current.add(`${node.id}-broken-route`);
                                            if (onWarning) onWarning({ id: crypto.randomUUID(), type: 'wiring', message: `Broken Routing: Logic step pointing to a node with no wire. Packet branch dropped.`, timestamp: new Date(), nodeId: node.id });
                                        }
                                    }
                                }
                            });
                            const otherSteps = stepsToRun.filter(s => s.action !== 'forward');
                            
                            if (forwardSteps.length === 0 && otherSteps.length === 0 && stepsToRun.length > 0) {
                                // All valid paths were broken routes
                                updateMetricsNow((m) => ({ ...m, droppedRequests: m.droppedRequests + 1, totalErrors: m.totalErrors + 1 }));
                                if (pulse.callerId) reply('cache-miss', '#ff6b6b', pulse.callerId, 502);
                                return;
                            }
                            
                            let chosenForwardSteps = forwardSteps;
                            if (node.data.routingStrategy === 'load-balance' && forwardSteps.length > 1) {
                                chosenForwardSteps = [forwardSteps[Math.floor(Math.random() * forwardSteps.length)]!];
                            }
                            
                            if (chosenForwardSteps.length > 1 && pulse.callerId) {
                                branchJoins.current[`${arrivedAtId}_${pulse.requestId}`] = {
                                    expected: chosenForwardSteps.length,
                                    completed: 0,
                                    hasFailed: false,
                                };
                            }
                            
                            const finalStepsToRun = [...chosenForwardSteps, ...otherSteps];
                            
                            finalStepsToRun.forEach(step => {
                                if (step.action === 'forward' && step.targetNodeId) {
                                    const edge = outgoingEdges.find(e => e.target === step.targetNodeId);
                                    if (edge) forward(edge, 'request', '#ff4fa3');
                                } else if (step.action === 'reply' && pulse.callerId) {
                                    reply('response', '#9cf57a', pulse.callerId, 200);
                                } else if (step.action === 'simulate-cache') {
                                    trace(`[${node.data.label}] Checking cache...`, '#ffde59', 'cache');
                                    // Use the slider hit rate if defined, otherwise fallback to step hit rate or 80
                                    const sliderHitRate = node.data.latency?.cacheHitRate;
                                    const targetHitRate = (sliderHitRate !== undefined ? sliderHitRate : (step.hitRate ?? 80)) / 100;
                                    const isHit = Math.random() < targetHitRate;
                                    
                                    if (targetHitRate < 0.3 && !warnedNodesRef.current.has(`${node.id}-cache-thrashing`)) {
                                        warnedNodesRef.current.add(`${node.id}-cache-thrashing`);
                                        if (onWarning) onWarning({ id: crypto.randomUUID(), type: 'cache-thrashing', message: `Cache Thrashing: ${node.data.label} hit rate is below 30% (${step.hitRate}%). This cache is ineffective!`, timestamp: new Date(), nodeId: node.id });
                                    }
                                    
                                    if (isHit) {
                                        trace(`[${node.data.label}] Cache HIT`, '#9cf57a', 'cache');
                                        executeSteps(new Set(['on-hit']));
                                    } else {
                                        trace(`[${node.data.label}] Cache MISS`, '#ffad66', 'error');
                                        executeSteps(new Set(['on-miss']));
                                    }
                                }
                            });
                        };

                        executeSteps(new Set(['always']));

                    } else if (pulse.type === 'response' || pulse.type === 'cache-miss') {
                        const code = pulse.statusCode || (pulse.type === 'cache-miss' ? 404 : 200);
                        const isError = code >= 400;
                        const isMiss = pulse.type === 'cache-miss' || code === 404;
                        const color = code >= 500 ? '#ff6b6b' : code >= 400 ? '#ffad66' : '#9cf57a';
                        
                        trace(
                            `[${tech.label}] Sending ${isError ? 'error ' : ''}reply`,
                            color,
                            isError ? 'error' : 'response',
                        );
                        
                        const key = `${arrivedAtId}_${pulse.requestId}`;
                        const callers = inFlightLb.current[key] || [];
                        
                        if (!hasLogic) return; // Drop if no logic

                        const conditions = new Set<string>();
                        if (!isError) conditions.add('on-success');
                        if (isError) conditions.add('on-error');
                        if (isMiss) conditions.add('on-miss');
                        if (!isError && !isMiss) conditions.add('on-hit');
                        
                        const joinKey = `${arrivedAtId}_${pulse.requestId}`;
                        if (branchJoins.current[joinKey]) {
                            const joinState = branchJoins.current[joinKey];
                            joinState.completed += 1;
                            if (isError) joinState.hasFailed = true;
                            
                            if (joinState.completed < joinState.expected) {
                                return; // Still waiting for more branches to complete
                            }
                            
                            delete branchJoins.current[joinKey];
                            if (joinState.hasFailed) {
                                conditions.delete('on-success');
                                conditions.delete('on-hit');
                                conditions.add('on-error');
                            }
                        }

                        // Consume one caller now that all branches have completed
                        const callerId = callers.shift();
                        if (callers.length > 0) {
                            inFlightLb.current[key] = callers;
                        } else {
                            delete inFlightLb.current[key];
                        }
                        
                        const executeSteps = (conds: Set<string>) => {
                            const stepsToRun = logicSteps.filter(s => conds.has(s.condition));
                            const forwardSteps: typeof logicSteps = [];
                            stepsToRun.forEach(s => {
                                if (s.action === 'forward' && s.targetNodeId) {
                                    if (outgoingEdges.some(e => e.target === s.targetNodeId)) {
                                        forwardSteps.push(s);
                                    } else {
                                        if (!warnedNodesRef.current.has(`${node.id}-broken-route`)) {
                                            warnedNodesRef.current.add(`${node.id}-broken-route`);
                                            if (onWarning) onWarning({ id: crypto.randomUUID(), type: 'wiring', message: `Broken Routing: Logic step pointing to a node with no wire. Packet branch dropped.`, timestamp: new Date(), nodeId: node.id });
                                        }
                                    }
                                }
                            });
                            const otherSteps = stepsToRun.filter(s => s.action !== 'forward');
                            
                            if (forwardSteps.length === 0 && otherSteps.length === 0 && stepsToRun.length > 0) {
                                // All valid paths were broken routes
                                updateMetricsNow((m) => ({ ...m, droppedRequests: m.droppedRequests + 1, totalErrors: m.totalErrors + 1 }));
                                if (callerId) reply('cache-miss', '#ff6b6b', callerId, 502);
                                return;
                            }
                            
                            let chosenForwardSteps = forwardSteps;
                            if (node.data.routingStrategy === 'load-balance' && forwardSteps.length > 1) {
                                // Pick one randomly
                                chosenForwardSteps = [forwardSteps[Math.floor(Math.random() * forwardSteps.length)]!];
                            }
                            
                            const finalStepsToRun = [...chosenForwardSteps, ...otherSteps];
                            
                            finalStepsToRun.forEach(step => {
                                if (step.action === 'forward' && step.targetNodeId) {
                                    const edge = outgoingEdges.find(e => e.target === step.targetNodeId);
                                    if (edge) forward(edge, 'request', '#ff4fa3');
                                } else if (step.action === 'reply' && callerId) {
                                    reply(pulse.type, color, callerId, code);
                                } else if (step.action === 'simulate-cache') {
                                    trace(`[${node.data.label}] Checking cache...`, '#ffde59', 'cache');
                                    // Use the slider hit rate if defined, otherwise fallback to step hit rate or 80
                                    const sliderHitRate = node.data.latency?.cacheHitRate;
                                    const targetHitRate = (sliderHitRate !== undefined ? sliderHitRate : (step.hitRate ?? 80)) / 100;
                                    const isCacheHit = Math.random() < targetHitRate;
                                    
                                    if (targetHitRate < 0.3 && !warnedNodesRef.current.has(`${node.id}-cache-thrashing`)) {
                                        warnedNodesRef.current.add(`${node.id}-cache-thrashing`);
                                        if (onWarning) onWarning({ id: crypto.randomUUID(), type: 'cache-thrashing', message: `Cache Thrashing: ${node.data.label} hit rate is below 30% (${step.hitRate}%). This cache is ineffective!`, timestamp: new Date(), nodeId: node.id });
                                    }
                                    
                                    if (isCacheHit) {
                                        trace(`[${node.data.label}] Cache HIT`, '#9cf57a', 'cache');
                                        executeSteps(new Set(['on-hit']));
                                    } else {
                                        trace(`[${node.data.label}] Cache MISS`, '#ffad66', 'error');
                                        executeSteps(new Set(['on-miss']));
                                    }
                                }
                            });
                        };

                        executeSteps(conditions);

                    }
                }
            };

            if (delay > 0 && pulse.type === 'request') {
                if (modeledLatency >= 250) {
                    if (!warnedNodesRef.current.has(`${node.id}-bottleneck`)) {
                        warnedNodesRef.current.add(`${node.id}-bottleneck`);
                        if (onWarning) onWarning({ id: crypto.randomUUID(), type: 'bottleneck', message: `Bottleneck Detected: ${node.data.label} is taking ${modeledLatency}ms to process requests.`, timestamp: new Date(), nodeId: node.id });
                    }
                    setBottleneckNodes((prev) => {
                        const next = new Set(prev);
                        next.add(node.id);
                        return next;
                    });
                }

                let queueLimit = 50;
                if (tech.category === 'client') queueLimit = Infinity;
                else if (tech.category === 'messaging') queueLimit = 5000;
                else if (tech.category === 'data') queueLimit = 100;
                
                const q = nodeQueuesRef.current[arrivedAtId] || [];
                const errorRate = node.data.errorRate ?? 0;
                const isCrash = errorRate > 0 && Math.random() < errorRate;

                if (isCrash || q.length >= queueLimit) {
                    const isQueueOverflow = !isCrash;

                    if (isQueueOverflow && !warnedNodesRef.current.has(`${node.id}-overflow`)) {
                        warnedNodesRef.current.add(`${node.id}-overflow`);
                        if (onWarning) onWarning({ id: crypto.randomUUID(), type: 'dropped', message: `Queue Overflow: ${node.data.label} queue is full (${queueLimit}). Dropping packets with 503 Service Unavailable!`, timestamp: new Date(), nodeId: node.id });
                    }
                    
                    updateMetricsNow((m) => ({ ...m, droppedRequests: m.droppedRequests + 1, totalErrors: m.totalErrors + 1 }));
                    
                    const logMessage = isCrash ? `[${node.data.label}] Node CRASHED/DROPPED packet (AI Error Rate: ${(errorRate*100).toFixed(0)}%)` : `[${node.data.label}] Node overloaded, queue full (503)`;
                    addLog(logMessage, '#ff6b6b', {
                        eventType: 'error',
                        requestId: pulse.requestId,
                        nodeId: node.id,
                    });
                    
                    if (pulse.callerId) {
                        reply('cache-miss', '#ff6b6b', pulse.callerId, isCrash ? 502 : 503);
                    } else {
                        // Crucial fix: If root node drops/overflows, cleanly finalize the flight state!
                        updateMetricsNow(m => ({ ...m, inFlightRequests: Math.max(0, m.inFlightRequests - 1), completedRequests: m.completedRequests + 1 }));
                        const req = requestLatencies.current[pulse.requestId];
                        if (req) {
                            req.lifecycle = 'failed';
                            delete requestLatencies.current[pulse.requestId];
                        }
                    }
                    return;
                }

                q.push({
                    pulse,
                    delay,
                    execute: () => {
                        if (modeledLatency >= 250) {
                            setBottleneckNodes((prev) => {
                                const next = new Set(prev);
                                next.delete(node.id);
                                return next;
                            });
                        }
                        executeLogic();
                    }
                });
                nodeQueuesRef.current[arrivedAtId] = q;
                processQueue(arrivedAtId, tech);

            } else {
                executeLogic();
            }
        },
        [emitPulse, addLog, createPausableTimeout, estimateNodeLatency],
    );

    useEffect(() => {
        handleArrivalRef.current = handleArrival;
    }, [handleArrival]);

    useEffect(() => {
        if (!isPlaying) {
            if (!isPaused) {
                setEdgePulses({});
                inFlightLb.current = {};
                branchJoins.current = {};
                requestSequence.current = 0;
                completedAt.current = [];
            }
            return;
        }

        // Only clear logs if we are freshly playing and not resuming from pause
        if (!isPausedRef.current) {
            setLogs([]);
        }

        const spawnClientRequests = () => {
            // LIMIT and MAX ACTIVE are counted in "user actions", not raw packets.
            // One user action = one client fires once, regardless of how many wires it has.
            const actionsSpawned = requestSequence.current;
            if (actionsSpawned >= totalLimitRef.current) return;
            
            // Count in-flight user actions (not raw packets)
            const inFlightActions = Object.keys(requestLatencies.current).length;
            if (inFlightActions >= maxInFlightRef.current) return;

            const clients = nodesRef.current.filter(
                (n) =>
                    !n.data.disabled && techsRef.current.find((t) => t.id === n.data.technologyId)
                        ?.category === 'client',
            );

            // Shuffle clients using Fisher-Yates for perfectly fair scheduling 
            const shuffledClients = [...clients];
            for (let i = shuffledClients.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const temp = shuffledClients[i];
                shuffledClients[i] = shuffledClients[j] as ArchitectureFlowNode;
                shuffledClients[j] = temp as ArchitectureFlowNode;
            }

            shuffledClients.forEach((client) => {
                // Re-check limits before each client fires (user-action level)
                if (requestSequence.current >= totalLimitRef.current) return;
                const currentInFlight = Object.keys(requestLatencies.current).length;
                if (currentInFlight >= maxInFlightRef.current) return;

                const outgoing = edgesRef.current.filter((e) => e.source === client.id);
                if (outgoing.length === 0) return;

                // One user action = +1 totalRequests, +1 inFlightRequests
                updateMetricsNow((m) => ({
                    ...m,
                    totalRequests: m.totalRequests + 1,
                    inFlightRequests: m.inFlightRequests + 1,
                }));
                
                handleArrivalRef.current({
                    id: crypto.randomUUID(),
                    edgeId: 'start',
                    sourceNodeId: 'external',
                    targetNodeId: client.id,
                    reverse: false,
                    type: 'request',
                    color: '#ffde59',
                    requestId: `request-${++requestSequence.current}`,
                    callerId: undefined,
                    size: 20 + Math.random() * 20,
                    protocol: 'HTTP',
                });
            });
        };

        spawnClientRequests();

        if (!singleCycle) {
            let intervalActive = true;
            const tick = 50;
            let timeSinceLastSpawn = 0;
            let lastTick = Date.now();

            const loop = () => {
                if (!intervalActive) return;
                if (!isPlayingRef.current) return; // Stop if not playing

                const now = Date.now();
                const elapsed = now - lastTick;
                lastTick = now;

                if (!isPausedRef.current) {
                    timeSinceLastSpawn += elapsed;
                    const requestInterval = 1000 / Math.max(0.1, requestsPerSecondRef.current);
                        
                    if (timeSinceLastSpawn >= requestInterval) {
                        spawnClientRequests();
                        timeSinceLastSpawn = 0;
                    }
                    
                    // Cleanup old timestamps and decay throughput
                    const cutoff = simulationClock.current - 1000;
                    completedAt.current = completedAt.current.filter(at => at >= cutoff);
                    const currentThroughput = completedAt.current.length;
                    if (metricsRef.current.throughputPerSecond !== currentThroughput) {
                        updateMetricsNow(m => ({ ...m, throughputPerSecond: currentThroughput }));
                    }
                }
                setTimeout(loop, tick);
            };

            setTimeout(loop, tick);
            return () => {
                intervalActive = false;
            };
        }
    }, [isPlaying, singleCycle]);

    const triggerChaosMonkey = useCallback((durationMs: number = 10000, targetId?: string) => {
        // Pick a random backend node or the specified target
        const backendNodes = nodesRef.current.filter(n => {
            const tech = techsRef.current.find(t => t.id === n.data.technologyId);
            return tech && tech.category !== 'client';
        });
        
        let target: ArchitectureFlowNode | undefined;
        
        if (targetId && targetId !== 'random') {
            target = backendNodes.find(n => n.id === targetId);
        } else if (backendNodes.length > 0) {
            target = backendNodes[Math.floor(Math.random() * backendNodes.length)];
        }

        if (target) {
            const tech = techsRef.current.find(t => t.id === target.data.technologyId);
                
                if (offlineNodesRef.current.has(target.id)) {
                    // Thaw it if it's already offline
                    offlineNodesRef.current.delete(target.id);
                    setOfflineNodes(new Set(offlineNodesRef.current));
                    addLog(`🔧 SYSTEM RECOVERED: ${target.data.label} is back online!`, '#9cf57a', {
                        eventType: 'response',
                        nodeId: target.id,
                    });
                    if (tech) processQueue(target.id, tech);
                } else {
                    // Kill it!
                    offlineNodesRef.current.add(target.id);
                    setOfflineNodes(new Set(offlineNodesRef.current));
                    addLog(`🐒 MANUAL CHAOS: ${target.data.label} is completely OFFLINE for ${durationMs / 1000}s!`, '#ff6b6b', {
                        eventType: 'error',
                        nodeId: target.id,
                    });
                    // Auto-recover after durationMs so the user isn't stuck forever
                    createPausableTimeout(() => {
                        if (offlineNodesRef.current.has(target.id)) {
                            offlineNodesRef.current.delete(target.id);
                            setOfflineNodes(new Set(offlineNodesRef.current));
                            addLog(`🔧 SYSTEM RECOVERED: ${target.data.label} auto-recovered!`, '#9cf57a', {
                                eventType: 'response',
                                nodeId: target.id,
                            });
                            if (tech) processQueue(target.id, tech);
                        }
                    }, durationMs);
                }
            }
    }, [addLog, processQueue, createPausableTimeout]);

    const resetSimulationState = useCallback(() => {
        setEdgePulses({});
        setLogs([]);
        updateMetricsNow(() => ({
            totalRequests: 0,
            completedRequests: 0,
            totalLatency: 0,
            totalErrors: 0,
            avgLatency: 0,
            p50Latency: 0,
            p95Latency: 0,
            p99Latency: 0,
            latencyBreakdown: {},
            inFlightRequests: 0,
            droppedRequests: 0,
            throughputPerSecond: 0,
            statusCodes: {},
        }));
        setBottleneckNodes(new Set());
        setNodeQueues({});
        setFrozenNodes(new Set());
        setOfflineNodes(new Set());
        nodeQueuesRef.current = {};
        nodeProcessingCount.current = {};
        frozenNodesRef.current = new Set();
        offlineNodesRef.current = new Set();
        cacheState.current = {};
        requestLatencies.current = {};
        latencySamples.current = [];
        simulationClock.current = 0;
        logSequence.current = 0;
        eventSequence.current = 0;
        eventQueue.current = [];
        branchJoins.current = {};
        requestSequence.current = 0;
        completedAt.current = [];
        inFlightLb.current = {};
        warnedNodesRef.current.clear();
        hasCompletedRef.current = false;
    }, []);

    const clearWarnings = useCallback(() => {
        warnedNodesRef.current.clear();
    }, []);

    return { edgePulses, logs, metrics, bottleneckNodes, nodeQueues, frozenNodes, offlineNodes, stepEvent, triggerChaosMonkey, resetSimulationState, clearWarnings };
}
