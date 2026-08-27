import {
    resolveLatencyProfile,
    type LatencyWorkload,
    type LogicStep,
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
}

interface ScheduledSimulationEvent {
    at: number;
    sequence: number;
    callback: () => void;
}

interface BranchJoinState {
    expected: number;
    completed: number;
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
    maxInFlightRequests: number = 8,
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
    });

    const requestLatencies = useRef<Record<string, RequestLatency>>({});
    const latencySamples = useRef<number[]>([]);
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
    const inFlightLb = useRef<Record<string, string>>({});

    useEffect(() => {
        nodesRef.current = nodes;
        edgesRef.current = edges;
        techsRef.current = technologies;
        isPlayingRef.current = isPlaying;
        isPausedRef.current = isPaused;
    }, [nodes, edges, isPlaying, isPaused, technologies]);

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
            const cacheCost =
                tech.category === 'cache'
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
                        (config.nodeOverrideMs ?? 0),
                ),
            );
        },
        [],
    );

    const handleArrival = useCallback(
        (pulse: InternalPulse) => {
            const arrivedAtId = pulse.reverse
                ? pulse.sourceNodeId
                : pulse.targetNodeId;
            const node = nodesRef.current.find((n) => n.id === arrivedAtId);
            if (!node) return;

            const tech = techsRef.current.find(
                (t) => t.id === node.data.technologyId,
            );
            if (!tech) return;

            const modeledLatency = estimateNodeLatency(node, tech, pulse.type);
            const delay = Math.min(
                1400,
                Math.max(
                    35,
                    Math.round(modeledLatency * 0.25) +
                        Math.round((node.data.processingDelay || 0) * 0.2),
                ),
            );

            const executeLogic = () => {
                if (!isPlayingRef.current) return;
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

                const reply = (
                    type: PulseType,
                    color: string,
                    specificCaller?: string,
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
                    });
                };

                const forward = (
                    edge: EventFlowEdge,
                    type: PulseType,
                    color: string,
                ) => {
                    emitPulse({
                        id: crypto.randomUUID(),
                        edgeId: edge.id,
                        sourceNodeId: edge.source,
                        targetNodeId: edge.target,
                        reverse: false,
                        type,
                        color,
                        requestId: pulse.requestId,
                        callerId: arrivedAtId,
                    });
                };

                const steps = node.data.logicSteps || [];

                if (steps.length > 0) {
                    let triggeredConditions: string[] = [];
                    if (pulse.type === 'request')
                        triggeredConditions.push('always');
                    else if (pulse.type === 'response') {
                        triggeredConditions.push('on-success');
                        triggeredConditions.push('on-hit');
                    } else {
                        triggeredConditions.push('on-error');
                        triggeredConditions.push('on-miss');
                    }

                    const runStep = (step: LogicStep) => {
                        if (step.action === 'forward' && step.targetNodeId) {
                            const targetNode = nodesRef.current.find(
                                (n) => n.id === step.targetNodeId,
                            );
                            trace(
                                `[${node.data.label}] Forwarding to ${targetNode?.data.label || 'Unknown'}`,
                                '#ff4fa3',
                                'forward',
                            );
                            if (pulse.type === 'request') {
                                inFlightLb.current[
                                    `${arrivedAtId}_${pulse.requestId}`
                                ] = pulse.callerId || '';
                            }
                            const targetEdge = outgoingEdges.find(
                                (e) => e.target === step.targetNodeId,
                            );
                            if (targetEdge) {
                                forward(targetEdge, 'request', '#ff4fa3');
                            }
                        } else if (step.action === 'reply') {
                            trace(
                                `[${node.data.label}] Returning: ''`,
                                '#9cf57a',
                                'response',
                            );
                            reply('response', '#9cf57a');
                        } else if (step.action === 'simulate-cache') {
                            trace(
                                `[${node.data.label}] Cache check failed`,
                                '#ff6b6b',
                                'error',
                            );
                            reply('cache-miss', '#ff6b6b');
                        }
                    };

                    let handled = false;
                    for (const step of steps) {
                        if (triggeredConditions.includes(step.condition)) {
                            runStep(step);
                            handled = true;
                        }
                    }

                    if (handled) return;
                }

                if (tech.category === 'client') {
                    if (pulse.type === 'request') {
                        if (outgoingEdges.length > 0) {
                            if (
                                Object.keys(requestLatencies.current).length >=
                                maxInFlightRequests
                            ) {
                                setMetrics((m) => ({
                                    ...m,
                                    droppedRequests: m.droppedRequests + 1,
                                }));
                                addLog(
                                    `[${node.data.label}] Request dropped: in-flight limit reached`,
                                    '#ff6b6b',
                                    {
                                        eventType: 'error',
                                        requestId: pulse.requestId,
                                        nodeId: node.id,
                                    },
                                );
                                return;
                            }
                            requestLatencies.current[pulse.requestId] = {
                                total: 0,
                                breakdown: {},
                                lifecycle: 'created',
                                startedAt: simulationClock.current,
                            };
                            setMetrics((m) => ({
                                ...m,
                                totalRequests: m.totalRequests + 1,
                                inFlightRequests: m.inFlightRequests + 1,
                            }));
                            outgoingEdges.forEach((edge) =>
                                forward(edge, 'request', '#ffde59'),
                            );
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
                            setMetrics((m) => {
                                const newTotal = m.totalLatency + latency;
                                const newCompleted = m.completedRequests + 1;
                                const newErrors =
                                    m.totalErrors + (isError ? 1 : 0);
                                const breakdown = { ...m.latencyBreakdown };
                                Object.entries(request.breakdown).forEach(
                                    ([label, value]) => {
                                        breakdown[label] =
                                            (breakdown[label] || 0) + value;
                                    },
                                );
                                return {
                                    ...m,
                                    completedRequests: newCompleted,
                                    totalLatency: newTotal,
                                    totalErrors: newErrors,
                                    avgLatency: Math.round(
                                        newTotal / newCompleted,
                                    ),
                                    p50Latency:
                                        sortedSamples[p50Index] || latency,
                                    p95Latency:
                                        sortedSamples[p95Index] || latency,
                                    p99Latency:
                                        sortedSamples[p99Index] || latency,
                                    latencyBreakdown: breakdown,
                                    inFlightRequests: Math.max(
                                        0,
                                        m.inFlightRequests - 1,
                                    ),
                                    throughputPerSecond:
                                        completedAt.current.filter(
                                            (at) =>
                                                simulationClock.current - at <=
                                                1000,
                                        ).length,
                                };
                            });
                            completedAt.current.push(simulationClock.current);
                            delete requestLatencies.current[pulse.requestId];
                        }
                    }
                } else if (
                    tech.category === 'data' ||
                    tech.category === 'storage'
                ) {
                    if (pulse.type === 'request') {
                        trace(
                            `[${node.data.label}] Querying data...`,
                            '#ffde59',
                            'processing',
                        );
                        trace(
                            `[${node.data.label}] Data retrieved`,
                            '#9cf57a',
                            'response',
                        );
                        reply('response', '#9cf57a');
                    }
                } else if (tech.category === 'cache') {
                    if (pulse.type === 'request') {
                        trace(
                            `[${node.data.label}] Checking cache...`,
                            '#ffde59',
                            'cache',
                        );
                        if (
                            deterministicSample(
                                `${pulse.requestId}:${node.id}`,
                            ) <
                            (node.data.latency?.cacheHitRate ?? 80) / 100
                        ) {
                            trace(
                                `[${node.data.label}] Cache HIT`,
                                '#9cf57a',
                                'cache',
                            );
                            reply('response', '#9cf57a');
                        } else {
                            trace(
                                `[${node.data.label}] Cache MISS`,
                                '#ff6b6b',
                                'error',
                            );
                            reply('cache-miss', '#ff6b6b');
                        }
                    } else if (pulse.type === 'cache-save') {
                        addLog(
                            `[${node.data.label}] Saving to cache`,
                            '#9cf57a',
                        );
                    }
                } else {
                    if (pulse.type === 'request') {
                        trace(
                            `[${tech.label}] Processing request`,
                            '#ffde59',
                            'processing',
                        );
                        if (pulse.callerId) {
                            inFlightLb.current[
                                `${arrivedAtId}_${pulse.requestId}`
                            ] = pulse.callerId;
                        }
                        if (outgoingEdges.length > 0) {
                            if (outgoingEdges.length > 1) {
                                branchJoins.current[
                                    `${arrivedAtId}:${pulse.requestId}`
                                ] = {
                                    expected: outgoingEdges.length,
                                    completed: 0,
                                };
                            }
                            outgoingEdges.forEach((edge) =>
                                forward(edge, 'request', '#ff4fa3'),
                            );
                        } else {
                            reply('response', '#9cf57a');
                        }
                    } else if (pulse.type === 'response') {
                        trace(
                            `[${tech.label}] Sending reply`,
                            '#9cf57a',
                            'response',
                        );
                        const callerId =
                            inFlightLb.current[
                                `${arrivedAtId}_${pulse.requestId}`
                            ];
                        const joinKey = `${arrivedAtId}:${pulse.requestId}`;
                        const join = branchJoins.current[joinKey];
                        if (join) {
                            join.completed += 1;
                            if (join.completed < join.expected) return;
                            delete branchJoins.current[joinKey];
                        }
                        if (callerId) {
                            reply('response', '#9cf57a', callerId);
                            delete inFlightLb.current[
                                `${arrivedAtId}_${pulse.requestId}`
                            ];
                        }
                    }
                }
            };

            if (delay > 0 && pulse.type === 'request') {
                if (modeledLatency >= 250) {
                    setBottleneckNodes((prev) => {
                        const next = new Set(prev);
                        next.add(node.id);
                        return next;
                    });
                }
                createPausableTimeout(() => {
                    if (modeledLatency >= 250) {
                        setBottleneckNodes((prev) => {
                            const next = new Set(prev);
                            next.delete(node.id);
                            return next;
                        });
                    }
                    executeLogic();
                }, delay);
            } else {
                executeLogic();
            }
        },
        [emitPulse, addLog, createPausableTimeout],
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
            const clients = nodesRef.current.filter(
                (n) =>
                    techsRef.current.find((t) => t.id === n.data.technologyId)
                        ?.category === 'client',
            );

            clients.forEach((client) => {
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
                    const requestInterval =
                        1000 / Math.max(0.1, requestsPerSecond);
                    if (timeSinceLastSpawn >= requestInterval) {
                        spawnClientRequests();
                        timeSinceLastSpawn -= requestInterval;
                    }
                }
                setTimeout(loop, tick);
            };

            setTimeout(loop, tick);
            return () => {
                intervalActive = false;
            };
        }
    }, [isPlaying, singleCycle, requestsPerSecond]);

    return { edgePulses, logs, metrics, bottleneckNodes, stepEvent };
}
