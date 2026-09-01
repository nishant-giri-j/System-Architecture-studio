'use client';

import {
    technologyLibrary,
    type LogicStep,
    type NodeLatencyConfig,
    type TechnologyDefinition,
    type ProtocolDefinition,
    type AiSecurityReviewResult,
    type AiLogicTestResult,
    type SystemWarning,
} from '@architecture-studio/shared';
import { useSecurityReview } from '../../hooks/use-security-review';
import { SecurityReviewModal } from './security-review-modal';
import { useLogicTester } from '../../hooks/use-logic-tester';
import { LogicTestModal } from './logic-test-modal';
import { FeedbackModal } from './feedback-modal';
import {
    addEdge,
    Background,
    ConnectionLineType,
    Controls,
    MiniMap,
    MarkerType,
    ReactFlowProvider,
    ReactFlow,
    useEdgesState,
    useNodesState,
    useReactFlow,
    type Connection,
    type EdgeMouseHandler,
    type EdgeTypes,
    type NodeTypes,
    type OnConnect,
    type ReactFlowInstance,
} from '@xyflow/react';
import { toPng } from 'html-to-image';
import {
    Activity,
    AlertTriangle,
    Download,
    Eraser,
    HelpCircle,
    Image as ImageIcon,
    Play,
    RotateCcw,
    Square,
    StepForward,
    StopCircle,
    Terminal,
    Upload,
    Video,
    WandSparkles,
    X,
    BarChart,
    FileText,
    Plus,
    Minus,
    Maximize,
    Layout,
    ShieldAlert,
    TestTube,
    Loader2,
    ArrowRight,
    ArrowLeft,
    ArrowDown,
    ArrowUp,
    ChevronDown,
    ChevronUp,
    BookOpen,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ArchitectureNode,
    type ArchitectureFlowNode,
} from './architecture-node';
import { BoundaryNode, type BoundaryFlowNode } from './boundary-node';
type AppNode = ArchitectureFlowNode | BoundaryFlowNode;

import { useSimulation } from '../../hooks/use-simulation';
import { isValidConnection } from '../../hooks/validate-architecture';
import { EdgePropertiesPanel } from './edge-properties';
import {
    EventEdge,
    type EventEdgeData,
    type EventFlowEdge,
} from './event-edge';
import { NodePropertiesPanel } from './node-properties';
import { TechContext } from './tech-context';
import { DND_MIME, TechnologyPalette } from './tech-palette';
import { InformationDrawer } from "./information-drawer";
import { AiPromptModal } from "./ai-prompt-modal";
import { useAiArchitect } from '../../hooks/use-ai-architect';
import { useAutoResolve } from '../../hooks/use-auto-resolve';
import { useExplainArchitecture } from '../../hooks/use-explain-architecture';
import { ExplainFlowModal } from './explain-flow-modal';
import { ExperimentModal } from './experiment-modal';
import { getLayoutedElements } from '../../lib/auto-layout';

const STORAGE_KEY = 'architecture-studio:phase-2-diagram';

const initialNodes: AppNode[] = [
    {
        id: 'client',
        type: 'architecture',
        position: { x: 40, y: 210 },
        data: {
            label: 'Web Client',
            technologyId: 'web-client',
            color: '#ffde59',
            description: 'Customer browser',
        },
    },
    {
        id: 'load-balancer',
        type: 'architecture',
        position: { x: 330, y: 210 },
        data: {
            label: 'Load Balancer',
            technologyId: 'load-balancer',
            color: '#5de2e7',
            description: 'Traffic router',
        },
    },
    {
        id: 'api',
        type: 'architecture',
        position: { x: 630, y: 110 },
        data: {
            label: 'Auth Service',
            technologyId: 'api-service',
            color: '#ff4fa3',
            description: 'Verifies identity',
        },
    },
    {
        id: 'database',
        type: 'architecture',
        position: { x: 930, y: 110 },
        data: {
            label: 'User Database',
            technologyId: 'postgresql',
            color: '#a18cff',
            description: 'Stores accounts',
        },
    },
    {
        id: 'cache',
        type: 'architecture',
        position: { x: 630, y: 350 },
        data: {
            label: 'Session Cache',
            technologyId: 'redis',
            color: '#9cf57a',
            description: 'Fast session lookup',
        },
    },
];

const initialEdges: EventFlowEdge[] = [
    {
        id: 'client-lb',
        source: 'client',
        target: 'load-balancer',
        type: 'event',
        markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
            color: '#161616',
        },
        data: { event: 'HTTPS request', protocol: 'HTTPS' },
    },
    {
        id: 'lb-api',
        source: 'load-balancer',
        target: 'api',
        type: 'event',
        markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
            color: '#161616',
        },
        data: { event: 'route login', protocol: 'HTTP' },
    },
    {
        id: 'api-db',
        source: 'api',
        target: 'database',
        type: 'event',
        markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
            color: '#161616',
        },
        data: { event: 'read user', protocol: 'SQL' },
    },
    {
        id: 'api-cache',
        source: 'api',
        target: 'cache',
        type: 'event',
        markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
            color: '#161616',
        },
        data: { event: 'get session', protocol: 'Redis' },
    },
];

const nodeTypes: NodeTypes = {
    architecture: ArchitectureNode,
    boundary: BoundaryNode,
};

const edgeTypes: EdgeTypes = {
    event: EventEdge,
};

function nextId(prefix: string) {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

type StoredDiagram = {
    nodes: AppNode[];
    edges: EventFlowEdge[];
    viewport?: { x: number; y: number; zoom: number };
};

function CustomCanvasControls() {
    const { zoomIn, zoomOut, fitView } = useReactFlow();
    return (
        <div className="absolute bottom-4 left-4 z-50 flex flex-col border-[2px] border-[#161616] bg-[#ffde59] shadow-[2px_2px_0_#161616]">
            <button onClick={() => zoomIn()} className="flex h-5 w-5 items-center justify-center hover:bg-white border-b-[2px] border-[#161616] transition-colors" title="Zoom In" type="button">
                <Plus size={12} strokeWidth={4} />
            </button>
            <button onClick={() => zoomOut()} className="flex h-5 w-5 items-center justify-center hover:bg-white border-b-[2px] border-[#161616] transition-colors" title="Zoom Out" type="button">
                <Minus size={12} strokeWidth={4} />
            </button>
            <button onClick={() => fitView({ padding: 0.2, duration: 200 })} className="flex h-5 w-5 items-center justify-center hover:bg-white transition-colors" title="Fit View" type="button">
                <Maximize size={10} strokeWidth={3} />
            </button>
        </div>
    );
}

export function ArchitectureCanvas() {
    const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<EventFlowEdge>([]);
    const [flowInstance, setFlowInstance] =
        useState<ReactFlowInstance<AppNode, EventFlowEdge>>();
    const [eventName, setEventName] = useState('');
  const [infoData, setInfoData] = useState<TechnologyDefinition | ProtocolDefinition | null>(null);
    const [selectedEdgeId, setSelectedEdgeId] = useState<string>();
    const [propertiesNodeId, setPropertiesNodeId] = useState<string>();
    const [propertiesEdgeId, setPropertiesEdgeId] = useState<string>();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [chaosDurationSeconds, setChaosDurationSeconds] = useState(10);
    const [chaosTargetId, setChaosTargetId] = useState<string>('random');
    const [isLogWindowOpen, setIsLogWindowOpen] = useState(false);
    const [terminalView, setTerminalView] = useState<'console' | 'trace'>(
        'trace',
    );
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);
    const [projectNotes, setProjectNotes] = useState("");
    const [isStatsOpen, setIsStatsOpen] = useState(false);
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    
    // Auto Layout Modal
    const [isAutoLayoutModalOpen, setIsAutoLayoutModalOpen] = useState(false);
    const [isAiToolsDropdownOpen, setIsAiToolsDropdownOpen] = useState(false);
    const [layoutDirection, setLayoutDirection] = useState<'LR' | 'RL' | 'TB' | 'BT'>('LR');
    
    // AI Architect
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const { generate, cancelGeneration, isGenerating, progress, error: aiError, clearError } = useAiArchitect();
    const { resolveIssue, isResolving, cancelResolve } = useAutoResolve(nodes as ArchitectureFlowNode[], edges, setNodes, setEdges);
    const [resolveSuccessMessage, setResolveSuccessMessage] = useState<string | null>(null);
    
    // Explain Architecture
    const [isExplainModalOpen, setIsExplainModalOpen] = useState(false);
    const { generateExplanation, cancelExplanation, clearExplanation, isExplaining, explanation, error: explainError } = useExplainArchitecture();
    
    // Security Review
    const [isSecurityReviewModalOpen, setIsSecurityReviewModalOpen] = useState(false);
    const [securityReviewResults, setSecurityReviewResults] = useState<AiSecurityReviewResult | null>(null);

    // AI Experiment Sweep
    const [isExperimentModalOpen, setIsExperimentModalOpen] = useState(false);
    const [experimentResetKey, setExperimentResetKey] = useState(0);
    const { runReview, cancelReview, isAnalyzing, error: securityError } = useSecurityReview();

    // Logic Tester
    const [isLogicTestModalOpen, setIsLogicTestModalOpen] = useState(false);
    const [logicTestResults, setLogicTestResults] = useState<AiLogicTestResult | null>(null);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const { runTest, cancelTest, isTesting, error: logicTestError } = useLogicTester();
    const [highlightedErrorNodeIds, setHighlightedErrorNodeIds] = useState<string[]>([]);
    const [highlightedErrorEdgeIds, setHighlightedErrorEdgeIds] = useState<string[]>([]);
    
    const [isSingleCycle, setIsSingleCycle] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [requestsPerSecond, setRequestsPerSecond] = useState(0.83);
    
    // Playback Limits
    const [maxInFlight, setMaxInFlight] = useState(100);
    const [totalLimit, setTotalLimit] = useState(1000);
    const [systemWarnings, setSystemWarnings] = useState<SystemWarning[]>([]);
    const [isWarningsPanelOpen, setIsWarningsPanelOpen] = useState(false);
    const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);


    const handleAutoLayout = useCallback((direction: 'LR' | 'RL' | 'TB' | 'BT' = 'LR') => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges, direction);
        setNodes(layoutedNodes as AppNode[]);
        setEdges(layoutedEdges as EventFlowEdge[]);
        if (flowInstance) {
            setTimeout(() => {
                flowInstance.fitView({ padding: 0.2, duration: 800 });
            }, 50);
        }
        setIsAutoLayoutModalOpen(false);
    }, [nodes, edges, setNodes, setEdges, flowInstance]);



    const [isLogGlowing, setIsLogGlowing] = useState(false);

    useEffect(() => {
        if (isPlaying || isSingleCycle) {
            setIsLogGlowing(true);
            const timeout = setTimeout(() => {
                setIsLogGlowing(false);
            }, 3000);
            return () => clearTimeout(timeout);
        } else {
            setIsLogGlowing(false);
        }
    }, [isPlaying, isSingleCycle]);

    const addToast = useCallback((message: string) => {
        const id = crypto.randomUUID();
        setToasts((prev) => [...prev, { id, message }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    // Dynamic Technology State
    const [technologies, setTechnologies] =
        useState<TechnologyDefinition[]>(technologyLibrary);

    // Reset chaosTargetId if the selected node is deleted
    useEffect(() => {
        if (chaosTargetId !== 'random' && !nodes.some(n => n.id === chaosTargetId)) {
            setChaosTargetId('random');
        }
    }, [nodes, chaosTargetId]);

    // Auto-fetch technologies periodically
    useEffect(() => {
        const fetchTechs = async () => {
            try {
                const res = await fetch('/api/technologies');
                if (res.ok) {
                    const data = await res.json();
                    setTechnologies(data);
                }
            } catch (err) {
                console.error('Failed to fetch latest technologies', err);
            }
        };

        fetchTechs(); // Initial fetch
        const interval = setInterval(fetchTechs, 1000 * 60 * 30); // 30 minutes
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
            try {
                const saved = JSON.parse(raw) as StoredDiagram;
                if (Array.isArray(saved.nodes) && Array.isArray(saved.edges)) {
                    setNodes(saved.nodes);
                    setEdges(saved.edges);
                }
            } catch {
                window.localStorage.removeItem(STORAGE_KEY);
            }
        }
        setIsHydrated(true);
    }, [setEdges, setNodes]);

    useEffect(() => {
        if (!isHydrated) return;
        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ 
                nodes, 
                edges, 
            } satisfies StoredDiagram),
        );
    }, [edges, isHydrated, nodes]);

    // Advanced Simulation Engine powered by LogicSteps
    const handleWarning = useCallback((warning: SystemWarning) => {
        setSystemWarnings((prev) => {
            // Avoid duplicate warnings for the same issue
            if (prev.some(w => w.nodeId === warning.nodeId && w.type === warning.type)) return prev;
            return [...prev, warning];
        });
    }, []);

    const {
        edgePulses,
        logs,
        metrics,
        bottleneckNodes,
        frozenNodes,
        offlineNodes,
        nodeQueues,
        stepEvent,
        triggerChaosMonkey,
        resetSimulationState,
        clearWarnings,
    } = useSimulation(
        nodes.filter(
            (n) => n.type === 'architecture',
        ) as ArchitectureFlowNode[],
        edges,
        isPlaying || isSingleCycle,
        isPaused,
        technologies,
        isSingleCycle,
        playbackSpeed,
        requestsPerSecond,
        maxInFlight,
        totalLimit,
        handleWarning,
        useCallback(() => {
            setIsPlaying(false);
            setIsSingleCycle(false);
            setIsPaused(false);
        }, [setIsPlaying, setIsSingleCycle, setIsPaused]),
    );

    const resetToolsState = useCallback(() => {
        setSecurityReviewResults(null);
        setLogicTestResults(null);
        setExperimentResetKey(k => k + 1);
        setHighlightedErrorNodeIds([]);
        setHighlightedErrorEdgeIds([]);
        setSystemWarnings([]);
        clearWarnings();
        setPropertiesNodeId(undefined);
        setPropertiesEdgeId(undefined);
        setSelectedEdgeId(undefined);
        setInfoData(null);
        setIsPlaying(false);
        setIsPaused(false);
        setIsLogWindowOpen(false);
        setIsTelemetryOpen(false);
    }, [clearWarnings]);

    const startContinuousSimulation = useCallback(() => {
        if (totalLimit < Infinity && metrics.totalRequests >= totalLimit && metrics.inFlightRequests === 0) {
            resetSimulationState();
        }
        setIsSingleCycle(false);
        setIsPaused(false);
        setIsPlaying(true);
    }, [metrics.totalRequests, metrics.inFlightRequests, totalLimit, resetSimulationState]);

    const stopSimulation = useCallback(() => {
        setIsPlaying(false);
        setIsPaused(false);
        setIsSingleCycle(false);
    }, []);

    const startSingleCycle = useCallback(() => {
        if (totalLimit < Infinity && metrics.totalRequests >= totalLimit && metrics.inFlightRequests === 0) {
            resetSimulationState();
        }
        // Stop and clear any paused or active run before starting a fresh cycle.
        setIsPlaying(false);
        setIsPaused(false);
        setIsSingleCycle(false);
        window.setTimeout(() => setIsSingleCycle(true), 0);
    }, [metrics.totalRequests, metrics.inFlightRequests, totalLimit, resetSimulationState]);

    const stepSimulation = useCallback(() => {
        if (totalLimit < Infinity && metrics.totalRequests >= totalLimit && metrics.inFlightRequests === 0) {
            resetSimulationState();
        }
        if (!isPlaying) {
            setIsSingleCycle(true);
            setIsPlaying(true);
            setIsPaused(true);
            return;
        }
        if (isPaused) stepEvent();
    }, [isPaused, isPlaying, stepEvent, metrics.totalRequests, metrics.inFlightRequests, totalLimit, resetSimulationState]);

    useEffect(() => {
        setEdges((currentEdges) => {
            let changed = false;
            const next = currentEdges.map((edge) => {
                const pulsesForEdge = edgePulses[edge.id] || [];
                const shouldAnimate = isPlaying && !isPaused;
                
                if (
                    edge.animated === shouldAnimate &&
                    edge.data?.pulses === pulsesForEdge &&
                    edge.data?.isPaused === isPaused &&
                    edge.data?.playbackSpeed === playbackSpeed
                ) {
                    return edge;
                }
                
                changed = true;
                return {
                    ...edge,
                    animated: shouldAnimate,
                    data: {
                        ...edge.data,
                        event: edge.data?.event ?? 'event',
                        pulses: pulsesForEdge,
                        isPaused,
                        playbackSpeed,
                    },
                };
            });
            return changed ? next : currentEdges;
        });
    }, [isPlaying, isPaused, edgePulses, playbackSpeed, setEdges]);

    // Apply bottleneck styles
    useEffect(() => {
        setNodes((nds) => {
            let changed = false;
            const next = nds.map((n) => {
                const isBottleneck = bottleneckNodes.has(n.id);
                const glowClass = isBottleneck ? ' bottleneck-glow' : '';
                const baseClass = n.className?.replace(' bottleneck-glow', '') || '';
                const targetClassName = (baseClass + glowClass).trim();
                
                if (n.className === targetClassName) return n;
                changed = true;
                return { ...n, className: targetClassName };
            });
            return changed ? next : nds;
        });
    }, [bottleneckNodes, setNodes]);

    const onUpdateNode = useCallback(
        (
            nodeId: string,
            logicSteps: LogicStep[],
            processingDelay?: number,
            latency?: NodeLatencyConfig,
            routingStrategy?: 'broadcast' | 'load-balance',
            disabled?: boolean,
            errorRate?: number
        ) => {
            setNodes((nds) =>
                nds.map((n) => {
                    if (n.id === nodeId && n.type === 'architecture') {
                        const archNode = n as ArchitectureFlowNode;
                        return {
                            ...archNode,
                            data: {
                                ...archNode.data,
                                logicSteps,
                                processingDelay:
                                    processingDelay !== undefined
                                        ? processingDelay
                                        : archNode.data.processingDelay,
                                latency: latency ?? archNode.data.latency,
                                routingStrategy: routingStrategy ?? archNode.data.routingStrategy,
                                disabled: disabled !== undefined ? disabled : archNode.data.disabled,
                                errorRate: errorRate !== undefined ? errorRate : archNode.data.errorRate,
                            },
                        } as ArchitectureFlowNode;
                    }
                    return n;
                }),
            );
        },
        [setNodes],
    );

    const onConnect: OnConnect = useCallback(
        (connection: Connection) => {
            const sourceNode = nodes.find((n) => n.id === connection.source);
            const targetNode = nodes.find((n) => n.id === connection.target);

            if (sourceNode && targetNode) {
                const validation = isValidConnection(
                    sourceNode as ArchitectureFlowNode,
                    targetNode as ArchitectureFlowNode,
                    technologies,
                );
                if (!validation.valid) {
                    addToast(validation.message || 'Invalid connection');
                    return; // Abort connection
                }
            }

            setEdges((currentEdges) =>
                addEdge(
                    {
                        ...connection,
                        id: nextId('edge'),
                        type: 'event',
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                            width: 16,
                            height: 16,
                            color: '#161616',
                        },
                        data: { event: 'new event', pulses: [] },
                    },
                    currentEdges,
                ),
            );
        },
        [nodes, technologies, setEdges, addToast],
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();
            const rawTechnology = event.dataTransfer.getData(DND_MIME);
            if (!rawTechnology || !flowInstance) return;

            try {
                const technology = JSON.parse(
                    rawTechnology,
                ) as TechnologyDefinition;
                const position = flowInstance.screenToFlowPosition({
                    x: event.clientX,
                    y: event.clientY,
                });
                const isBoundary = technology.category === 'boundary';

                setNodes((currentNodes) => [
                    ...currentNodes,
                    {
                        id: nextId(technology.id),
                        type: isBoundary ? 'boundary' : 'architecture',
                        position,
                        style: isBoundary
                            ? { width: 300, height: 200, zIndex: -1 }
                            : undefined,
                        data: isBoundary
                            ? {
                                  label: technology.label,
                                  color: technology.color,
                                  description: technology.description,
                              }
                            : {
                                  label: technology.label,
                                  technologyId: technology.id,
                                  color: technology.color,
                                  description: technology.description,
                                  logicSteps: [],
                                  latency: {
                                      latencyProfileId: technology.id,
                                      latencyMultiplier: 1,
                                      cacheHitRate: 80,
                                      concurrency: 1,
                                      workload: 'normal',
                                      networkHops: 1,
                                      nodeOverrideMs: 0,
                                  },
                              },
                    } as AppNode,
                ]);
            } catch {
                // Ignore data that did not originate from the palette.
            }
        },
        [flowInstance, setNodes],
    );

    const onEdgeClick: EdgeMouseHandler<EventFlowEdge> = useCallback(
        (_, edge) => {
            setSelectedEdgeId(edge.id);
            setEventName(edge.data?.event ?? '');
        },
        [],
    );

    const saveEventName = useCallback(() => {
        if (!selectedEdgeId) return;
        const trimmedName = eventName.trim();
        if (!trimmedName) return;
        setEdges((currentEdges) =>
            currentEdges.map((edge) =>
                edge.id === selectedEdgeId
                    ? { ...edge, data: { ...edge.data, event: trimmedName } }
                    : edge,
            ),
        );
    }, [eventName, selectedEdgeId, setEdges]);


    const resetSimulation = useCallback(() => {
        setIsPlaying(false);
        setIsSingleCycle(false);
        setIsPaused(false);
        setSelectedEdgeId(undefined);
        resetSimulationState();
    }, [resetSimulationState]);

    // Export Features
    const handleExportJSON = () => {
        const viewport = flowInstance?.getViewport() ?? { x: 0, y: 0, zoom: 1 };
        const payload = { nodes, edges, viewport };
        const blob = new Blob([JSON.stringify(payload, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'architecture-studio.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const payload = JSON.parse(
                    event.target?.result as string,
                ) as StoredDiagram;
                if (payload.nodes && payload.edges) {
                    setNodes(payload.nodes);
                    setEdges(payload.edges);
                    resetToolsState();
                    resetSimulationState();
                    if (payload.viewport && flowInstance) {
                        flowInstance.setViewport(payload.viewport);
                    } else {
                        setTimeout(
                            () => flowInstance?.fitView({ padding: 0.2 }),
                            0,
                        );
                    }
                }
            } catch (err) {
                console.error('Failed to import JSON', err);
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset input
    };

    const downloadNotesTxt = useCallback(() => {
        const blob = new Blob([projectNotes], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'project-notes.txt';
        a.click();
        URL.revokeObjectURL(url);
    }, [projectNotes]);

    const handleDownloadExplanation = useCallback(() => {
        if (!explanation) return;
        const blob = new Blob([explanation], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `architecture-flow-explanation.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [explanation]);

    const handleDownloadSecurityReport = useCallback(() => {
        if (!securityReviewResults) return;
        
        let md = `# Architecture Security Review\n\n`;
        md += `**Risk Score**: ${securityReviewResults.overallRiskScore} / 100\n`;
        md += `**Summary**: ${securityReviewResults.summary}\n\n`;
        md += `## Findings (${securityReviewResults.vulnerabilities.length})\n\n`;
        
        securityReviewResults.vulnerabilities.forEach((vuln) => {
            md += `### [${vuln.severity.toUpperCase()}] ${vuln.title} (${vuln.type})\n`;
            md += `**Description**: ${vuln.description}\n\n`;
            md += `**Affected Nodes**: ${vuln.affectedNodeIds.join(', ')}\n\n`;
            md += `**Remediation**: ${vuln.remediation}\n\n`;
            md += `---\n\n`;
        });
        
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'security-review-report.md';
        a.click();
        URL.revokeObjectURL(url);
    }, [securityReviewResults]);

    const downloadNotesJson = useCallback(() => {
        const blob = new Blob([JSON.stringify({ notes: projectNotes }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'project-notes.json';
        a.click();
        URL.revokeObjectURL(url);
    }, [projectNotes]);

    const handleExportPNG = async () => {
        const el = document.querySelector('.react-flow') as HTMLElement;
        if (!el) return;
        try {
            // Ensure we don't capture the UI controls (minimap, etc) if we don't want to,
            // but toPng will capture what's visible. We set a background so it's not transparent.
            const dataUrl = await toPng(el, { backgroundColor: '#fffdf5' });
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = 'architecture-studio.png';
            a.click();
        } catch (err) {
            console.error('Failed to export PNG', err);
        }
    };

    const handleStartRecording = async () => {
        try {
            const flowEl = document.querySelector('.react-flow') as HTMLElement;
            if (!flowEl) return;
            const rect = flowEl.getBoundingClientRect();

            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { displaySurface: 'browser' },
                audio: false,
                // @ts-ignore - non-standard but supported by Chrome/Edge to default to current tab
                preferCurrentTab: true,
            });

            // Play the captured stream in a hidden video element
            const video = document.createElement('video');
            video.srcObject = stream;
            video.muted = true;
            video.playsInline = true;
            await video.play();

            // Create a hidden canvas matching the exact size of the React Flow container
            const canvas = document.createElement('canvas');
            canvas.width = rect.width;
            canvas.height = rect.height;
            const ctx = canvas.getContext('2d');

            // Calculate scale factors in case the video resolution (e.g. Retina display) differs from CSS resolution
            const scaleX = video.videoWidth / window.innerWidth;
            const scaleY = video.videoHeight / window.innerHeight;

            const sx = rect.left * scaleX;
            const sy = rect.top * scaleY;
            const sWidth = rect.width * scaleX;
            const sHeight = rect.height * scaleY;

            let animationFrameId: number;
            const drawFrame = () => {
                if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
                    ctx.drawImage(
                        video,
                        sx,
                        sy,
                        sWidth,
                        sHeight,
                        0,
                        0,
                        canvas.width,
                        canvas.height,
                    );
                }
                animationFrameId = requestAnimationFrame(drawFrame);
            };
            drawFrame();

            // Capture the stream directly from our cropped canvas at 30 FPS
            const canvasStream = canvas.captureStream(30);
            const recorder = new MediaRecorder(canvasStream, {
                mimeType: 'video/webm',
            });
            const chunks: BlobPart[] = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size) chunks.push(e.data);
            };

            recorder.onstop = () => {
                cancelAnimationFrame(animationFrameId);
                video.pause();
                video.srcObject = null;
                stream.getTracks().forEach((track) => track.stop());

                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'architecture-flow.webm';
                a.click();
                URL.revokeObjectURL(url);
                setIsRecording(false);
                setIsPlaying(false);
            };

            // Stop if the user stops sharing via the browser UI
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.onended = () => {
                    if (recorder.state === 'recording') {
                        recorder.stop();
                    }
                };
            }

            recorder.start();
            mediaRecorderRef.current = recorder;
            setIsRecording(true);
            setIsSingleCycle(true); // Automatically play exactly ONE cycle of the flow during recording!

            // Hide selection so it doesn't show in recording
            setSelectedEdgeId(undefined);
            setPropertiesEdgeId(undefined);
            setPropertiesNodeId(undefined);

            // AUTOMATICALLY stop and download after 6 seconds (enough time for one full cycle to travel through the graph)
            setTimeout(() => {
                if (recorder.state === 'recording') {
                    recorder.stop();
                }
                setIsSingleCycle(false);
            }, 6000);
        } catch (err) {
            console.error('Recording failed', err);
            setIsRecording(false);
        }
    };

    return (
        <TechContext.Provider value={technologies}>
            <ReactFlowProvider>
            <main className="flex h-dvh min-h-[700px] flex-col overflow-hidden bg-[#fffdf5] p-3 sm:p-5 relative">
                <header className="neo-panel mb-4 flex flex-col gap-3 bg-[#ffde59] px-4 py-3 sm:px-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center border-[3px] border-[#161616] bg-[#ff4fa3]">
                                <WandSparkles size={23} strokeWidth={3} />
                            </div>
                            <div>
                                <h1 className="m-0 text-xl font-black uppercase tracking-tight sm:text-2xl">
                                    Architecture Studio
                                </h1>
                                <p className="m-0 text-xs font-bold">
                                    Build it. Connect it. Play it.
                                </p>
                            </div>
                        </div>

                        {/* AI Tools */}
                        <div className={`relative shrink-0 ${isAiToolsDropdownOpen ? 'z-[90010]' : 'z-50'}`}>
                            <button
                                className="neo-button flex items-center gap-1.5 bg-[#ffde59] px-4 py-2 border-[3px] border-[#161616] shadow-[3px_3px_0_#161616] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[1px_1px_0_#161616] transition-all"
                                onClick={() => setIsAiToolsDropdownOpen(!isAiToolsDropdownOpen)}
                                type="button"
                                title="Open AI Tools"
                            >
                                <WandSparkles size={16} strokeWidth={3} />
                                <span className="font-black uppercase text-sm">AI Tools</span>
                            </button>

                            {isAiToolsDropdownOpen && (
                                <>
                                    {/* Backdrop to close dropdown on click outside */}
                                    <div 
                                        className="fixed inset-0 z-[10005]" 
                                        onClick={() => setIsAiToolsDropdownOpen(false)}
                                    />
                                    <div className="absolute right-0 top-full mt-3 flex w-[550px] flex-col border-[3px] border-[#161616] bg-[#fffdf5] shadow-[8px_8px_0_#161616] z-[10006] animate-in fade-in slide-in-from-top-2 origin-top-right">
                                        <div className="bg-[#ff4fa3] px-4 py-3 border-b-[3px] border-[#161616] flex justify-between items-center">
                                            <div className="flex items-center gap-1.5 text-white">
                                                <WandSparkles size={18} strokeWidth={3} />
                                                <span className="font-black uppercase tracking-wider text-sm">Magic AI Tools</span>
                                            </div>
                                            <button onClick={() => setIsAiToolsDropdownOpen(false)} className="hover:bg-white/20 p-1 rounded transition-colors">
                                                <X size={18} strokeWidth={3} className="text-white" />
                                            </button>
                                        </div>
                                        
                                        <div className="p-4 grid grid-cols-2 gap-4">
                                            {/* AI Architect */}
                                            <div className="border-[3px] border-[#161616] p-4 bg-white shadow-[4px_4px_0_#161616] flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center gap-1.5 mb-2">
                                                        <div className="bg-[#ff4fa3] p-1.5 border-[2px] border-[#161616] text-white shrink-0">
                                                            <WandSparkles size={16} strokeWidth={3} />
                                                        </div>
                                                        <h3 className="font-black uppercase text-sm leading-tight">AI Architect</h3>
                                                    </div>
                                                    <p className="text-xs text-gray-600 font-medium mb-4">Prompt-to-Architecture. Describe your system and let AI build it.</p>
                                                </div>
                                                <button
                                                    className="neo-button w-full bg-[#161616] text-white px-2 py-2 font-black uppercase text-xs border-[3px] border-[#161616] hover:bg-gray-800 transition-colors"
                                                    onClick={() => {
                                                        setIsAiModalOpen(true);
                                                        setIsAiToolsDropdownOpen(false);
                                                    }}
                                                >
                                                    Open Generator
                                                </button>
                                            </div>

                                            {/* Auto-Layout */}
                                            <div className="border-[3px] border-[#161616] p-4 bg-white shadow-[4px_4px_0_#161616] flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center gap-1.5 mb-2">
                                                        <div className="bg-[#5de2e7] p-1.5 border-[2px] border-[#161616] shrink-0">
                                                            <Layout size={16} strokeWidth={3} />
                                                        </div>
                                                        <h3 className="font-black uppercase text-sm leading-tight">Auto-Layout</h3>
                                                    </div>
                                                    <p className="text-xs text-gray-600 font-medium mb-4">Automatically arrange your nodes and wires into a clean flow.</p>
                                                </div>
                                                <button
                                                    className="neo-button w-full bg-[#161616] text-white px-2 py-2 font-black uppercase text-xs border-[3px] border-[#161616] hover:bg-gray-800 transition-colors"
                                                    onClick={() => {
                                                        setIsAutoLayoutModalOpen(true);
                                                        setIsAiToolsDropdownOpen(false);
                                                    }}
                                                >
                                                    Open Formatter
                                                </button>
                                            </div>

                                            {/* Explain Flow */}
                                            <div className="border-[3px] border-[#161616] p-4 bg-white shadow-[4px_4px_0_#161616] flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center gap-1.5 mb-2">
                                                        <div className="bg-[#9cf57a] p-1.5 border-[2px] border-[#161616] shrink-0">
                                                            <BookOpen size={16} strokeWidth={3} className="text-[#161616]" />
                                                        </div>
                                                        <h3 className="font-black uppercase text-sm leading-tight">Explain Flow</h3>
                                                    </div>
                                                    <p className="text-xs text-gray-600 font-medium mb-4">Generate a simple English walkthrough of the entire packet lifecycle.</p>
                                                </div>
                                                <button
                                                    className="neo-button w-full bg-[#161616] text-white px-2 py-2 font-black uppercase text-xs border-[3px] border-[#161616] hover:bg-gray-800 transition-colors"
                                                    onClick={() => {
                                                        setIsExplainModalOpen(true);
                                                        setIsAiToolsDropdownOpen(false);
                                                    }}
                                                >
                                                    Open Explanation
                                                </button>
                                            </div>

                                            {/* Security Review */}
                                            <div className="border-[3px] border-[#161616] p-4 bg-white shadow-[4px_4px_0_#161616] flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center gap-1.5 mb-2">
                                                        <div className="bg-[#ff6b6b] p-1.5 border-[2px] border-[#161616] text-white shrink-0">
                                                            <ShieldAlert size={16} strokeWidth={3} />
                                                        </div>
                                                        <h3 className="font-black uppercase text-sm leading-tight">Security Review</h3>
                                                    </div>
                                                    <p className="text-xs text-gray-600 font-medium mb-4">Scan for vulnerabilities, bottlenecks, and single points of failure.</p>
                                                </div>
                                                <button
                                                    className="neo-button w-full bg-[#161616] text-white px-2 py-2 font-black uppercase text-xs border-[3px] border-[#161616] hover:bg-gray-800 transition-colors"
                                                    onClick={() => {
                                                        setIsSecurityReviewModalOpen(true);
                                                        setIsAiToolsDropdownOpen(false);
                                                    }}
                                                >
                                                    Open Scanner
                                                </button>
                                            </div>

                                            {/* AI Experiments */}
                                            <div className="border-[3px] border-[#161616] p-4 bg-white shadow-[4px_4px_0_#161616] flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center gap-1.5 mb-2">
                                                        <div className="bg-[#5de2e7] p-1.5 border-[2px] border-[#161616] shrink-0">
                                                            <Activity size={16} strokeWidth={3} className="text-[#161616]" />
                                                        </div>
                                                        <h3 className="font-black uppercase text-sm leading-tight">AI Experiments</h3>
                                                    </div>
                                                    <p className="text-xs text-gray-600 font-medium mb-4">Run automated parameter sweeps and chaos scenarios.</p>
                                                </div>
                                                <button
                                                    className="neo-button w-full bg-[#161616] text-white px-2 py-2 font-black uppercase text-xs border-[3px] border-[#161616] hover:bg-gray-800 transition-colors"
                                                    onClick={() => {
                                                        setIsExperimentModalOpen(true);
                                                        setIsAiToolsDropdownOpen(false);
                                                    }}
                                                >
                                                    Open Sweeper
                                                </button>
                                            </div>

                                            {/* Logic Tester */}
                                            <div className="border-[3px] border-[#161616] p-4 bg-white shadow-[4px_4px_0_#161616] flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center gap-1.5 mb-2">
                                                        <div className="bg-[#ffde59] p-1.5 border-[2px] border-[#161616] shrink-0">
                                                            <TestTube size={16} strokeWidth={3} />
                                                        </div>
                                                        <h3 className="font-black uppercase text-sm leading-tight">Logic Tester</h3>
                                                    </div>
                                                    <p className="text-xs text-gray-600 font-medium mb-4">Check for infinite loops, missing fallbacks, and queue errors.</p>
                                                </div>
                                                <button
                                                    className="neo-button w-full bg-[#161616] text-white px-2 py-2 font-black uppercase text-xs border-[3px] border-[#161616] hover:bg-gray-800 transition-colors"
                                                    onClick={() => {
                                                        setIsLogicTestModalOpen(true);
                                                        setIsAiToolsDropdownOpen(false);
                                                    }}
                                                >
                                                    Open Tester
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex w-full flex-col lg:flex-row items-start lg:items-center justify-between border-t-[3px] border-[#161616] pt-3 gap-3 lg:gap-0">
                        <div className="flex flex-wrap items-center gap-1.5 lg:gap-1">

                        <button
                            className="header-control neo-button flex shrink-0 items-center gap-1.5 bg-white px-2"
                            onClick={startSingleCycle}
                            type="button"
                            title="Run one request cycle"
                        >
                            <StepForward size={16} strokeWidth={3} />
                            <span className="hidden sm:inline">Run Once</span>
                        </button>

                        <div className="flex h-12 shrink-0 border-[3px] border-[#161616] bg-[#161616] shadow-[3px_3px_0_#161616]">
                            <button
                                className={`flex items-center gap-1.5 px-2 text-sm font-black uppercase transition-colors ${isPlaying ? 'bg-[#9cf57a]' : 'bg-[#fffdf5] hover:bg-[#5de2e7]'}`}
                                onClick={() => {
                                    startContinuousSimulation();
                                }}
                                type="button"
                                title="Play"
                            >
                                <Play
                                    size={16}
                                    fill={isPlaying ? 'currentColor' : 'none'}
                                    strokeWidth={3}
                                />
                                <span className="hidden sm:inline">Play</span>
                            </button>
                            <div className="w-[3px] bg-[#161616]"></div>
                            <button
                                className={`flex items-center gap-1.5 px-2 text-sm font-black uppercase transition-colors disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:opacity-100 ${isPaused ? 'bg-[#ffde59]' : 'bg-[#fffdf5] hover:bg-[#ffde59]'}`}
                                onClick={() => {
                                    if (isPlaying) setIsPaused(true);
                                }}
                                type="button"
                                title="Pause"
                                disabled={!isPlaying}
                            >
                                <Square
                                    size={14}
                                    fill={isPaused ? 'currentColor' : 'none'}
                                    strokeWidth={3}
                                />
                                <span className="hidden sm:inline">Pause</span>
                            </button>
                        </div>

                        <label className="header-control neo-control flex shrink-0 items-center gap-1.5 bg-[#f0f0f0] px-2" title="Playback speed">
                            <span className="font-black text-gray-700 text-[10px] uppercase">Speed</span>
                            <select
                                className="h-7 bg-white border-[2px] border-[#161616] px-1 text-xs font-black shadow-[2px_2px_0_#161616] outline-none cursor-pointer hover:bg-gray-50 transition-colors"
                                value={playbackSpeed}
                                onChange={(event) =>
                                    setPlaybackSpeed(Number(event.target.value))
                                }
                                title="Simulation playback speed"
                            >
                                <option value="0.25">0.25x</option>
                                <option value="0.5">0.5x</option>
                                <option value="1">1x</option>
                                <option value="2">2x</option>
                                <option value="4">4x</option>
                            </select>
                        </label>

                        <label className="header-control neo-control flex shrink-0 items-center gap-1.5 bg-[#f0f0f0] px-2" title="Requests per second">
                            <span className="font-black text-gray-700 text-[10px] uppercase">RPS</span>
                            <input
                                className="w-16 h-7 bg-white border-[2px] border-[#161616] px-1 text-xs font-black shadow-[2px_2px_0_#161616] outline-none hover:bg-gray-50 transition-colors"
                                type="number"
                                min="0.1"
                                max="20"
                                step="0.1"
                                value={requestsPerSecond}
                                onChange={(event) =>
                                    setRequestsPerSecond(
                                        Math.min(
                                            20,
                                            Math.max(
                                                0.1,
                                                Number(event.target.value),
                                            ),
                                        ),
                                    )
                                }
                                title="Requests per second"
                            />
                        </label>

                        <label className="header-control neo-control flex shrink-0 items-center gap-1.5 bg-[#f0f0f0] px-2" title="Max concurrent packets allowed in flight">
                            <span className="font-black text-gray-700 text-[10px] uppercase">Max Active</span>
                            <input
                                className="w-16 h-7 bg-white border-[2px] border-[#161616] px-1 text-xs font-black shadow-[2px_2px_0_#161616] outline-none hover:bg-gray-50 transition-colors"
                                type="number"
                                min="1"
                                max="1000"
                                step="1"
                                value={maxInFlight === Infinity ? '' : maxInFlight}
                                onChange={(event) =>
                                    setMaxInFlight(
                                        event.target.value === '' ? Infinity : Math.max(1, Number(event.target.value))
                                    )
                                }
                                placeholder="∞"
                            />
                        </label>

                        <label className="header-control neo-control flex shrink-0 items-center gap-1.5 bg-[#f0f0f0] px-2" title="Absolute total packets to send before stopping">
                            <span className="font-black text-gray-700 text-[10px] uppercase">Limit</span>
                            <input
                                className="w-16 h-7 bg-white border-[2px] border-[#161616] px-1 text-xs font-black shadow-[2px_2px_0_#161616] outline-none hover:bg-gray-50 transition-colors"
                                type="number"
                                min="1"
                                step="1"
                                value={totalLimit === Infinity ? '' : totalLimit}
                                onChange={(event) =>
                                    setTotalLimit(
                                        event.target.value === '' ? Infinity : Math.max(1, Number(event.target.value))
                                    )
                                }
                                placeholder="∞"
                            />
                        </label>

                        <div className="header-control flex shrink-0 items-stretch border-[3px] border-[#161616] shadow-[3px_3px_0_#161616] transition-all hover:translate-y-[-1px] hover:translate-x-[-1px] hover:shadow-[5px_5px_0_#161616]">
                            <div className="flex items-center border-r-[3px] border-[#161616] bg-[#ffde59] transition-colors relative" title="Select Chaos Target">
                                <select
                                    className="appearance-none bg-transparent font-black text-[10px] text-[#161616] pl-2 pr-5 py-1 outline-none cursor-pointer w-[90px] truncate"
                                    value={chaosTargetId}
                                    onChange={(e) => setChaosTargetId(e.target.value)}
                                >
                                    <option value="random">🎯 RANDOM</option>
                                    {nodes.filter(n => n.type === 'architecture' && technologies.find(t => t.id === (n.data as any).technologyId)?.category !== 'client').map(n => (
                                        <option key={n.id} value={n.id}>{(n.data as any).label || 'Unnamed Node'}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} strokeWidth={4} className="absolute right-1 text-[#161616] pointer-events-none" />
                            </div>
                            <button
                                className={`flex items-center gap-1.5 px-2 transition-colors bg-[#ff6b6b] text-white hover:bg-[#ff5252] active:bg-[#e04848] ${(!isPlaying && !isPaused) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => triggerChaosMonkey(chaosDurationSeconds * 1000, chaosTargetId)}
                                type="button"
                                title={`Take ${chaosTargetId === 'random' ? 'a random' : 'the selected'} backend node OFFLINE for ${chaosDurationSeconds} seconds!`}
                                disabled={!isPlaying && !isPaused}
                            >
                                <span className="hidden sm:inline text-base">🐒</span>
                                <span className="hidden sm:inline font-black text-xs uppercase">Chaos</span>
                            </button>
                            
                            <div className="flex items-stretch border-l-[3px] border-[#161616] bg-[#ff4fa3]">
                                <div className="flex items-center justify-center pl-2 pr-1" title="Set exact chaos duration in seconds">
                                    <input
                                        className="bg-transparent font-black text-xs text-white text-center w-6 outline-none m-0 p-0 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                        type="number"
                                        min="1"
                                        max="600"
                                        value={chaosDurationSeconds}
                                        onChange={(e) => setChaosDurationSeconds(Math.max(1, Number(e.target.value)))}
                                    />
                                    <span className="font-black text-xs text-white pointer-events-none pr-1">s</span>
                                </div>
                                <div className="flex flex-col border-l-[3px] border-[#161616]">
                                    <button 
                                        type="button"
                                        className="bg-[#ff6b6b] hover:bg-[#ff5252] flex-1 px-1 border-b-[3px] border-[#161616] flex items-center justify-center active:bg-[#e04848] transition-colors"
                                        onClick={() => setChaosDurationSeconds(s => s + 1)}
                                    >
                                        <ChevronUp size={12} strokeWidth={4} className="text-white"/>
                                    </button>
                                    <button 
                                        type="button"
                                        className="bg-[#ff6b6b] hover:bg-[#ff5252] flex-1 px-1 flex items-center justify-center active:bg-[#e04848] transition-colors"
                                        onClick={() => setChaosDurationSeconds(s => Math.max(1, s - 1))}
                                    >
                                        <ChevronDown size={12} strokeWidth={4} className="text-white"/>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            className="header-control neo-button flex shrink-0 items-center gap-1.5 bg-[#5de2e7] px-2 disabled:!bg-gray-200 disabled:!text-gray-400 disabled:!border-gray-400 disabled:shadow-none disabled:translate-y-[3px] disabled:translate-x-[3px] disabled:cursor-not-allowed"
                            onClick={stepSimulation}
                            type="button"
                            title="Process one simulation event while paused"
                            disabled={isPlaying && !isPaused}
                        >
                            <StepForward size={16} strokeWidth={3} />
                            <span className="hidden sm:inline">Step</span>
                        </button>

                        <button
                            className="header-control neo-button flex shrink-0 items-center gap-1.5 bg-[#fffdf5] px-2"
                            onClick={resetSimulation}
                            type="button"
                            title="Reset Simulation State"
                        >
                            <RotateCcw size={17} strokeWidth={3} />{' '}
                            <span className="hidden sm:inline">Reset</span>
                        </button>

                        <button
                            className="header-control neo-button flex shrink-0 items-center gap-1.5 bg-[#ff6b6b] px-2 disabled:!bg-gray-200 disabled:!text-gray-400 disabled:!border-gray-400 disabled:shadow-none disabled:translate-y-[3px] disabled:translate-x-[3px] disabled:cursor-not-allowed"
                            onClick={stopSimulation}
                            type="button"
                            title="Stop simulation and clear active packets"
                            disabled={!isPlaying && !isPaused && !isSingleCycle}
                        >
                            <StopCircle size={16} strokeWidth={3} />
                            <span className="hidden sm:inline">Stop</span>
                        </button>
                        </div>


                    </div>
                </header>

                <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row relative">
                    <TechnologyPalette onShowInfo={setInfoData} />

                    <section
                        className="neo-panel relative min-h-[440px] min-w-0 flex-1 overflow-hidden bg-white"
                        aria-label="Architecture diagram canvas"
                    >
                              {infoData && (
        <InformationDrawer 
          data={infoData} 
          onClose={() => setInfoData(null)} 
        />
      )}

      {/* Telemetry HUD */}
                        <div className="absolute top-4 left-4 z-50 pointer-events-auto">
                            {!isTelemetryOpen && (
                                <button
                                    className="neo-button flex h-12 min-w-12 items-center justify-center gap-2 bg-[#fffdf5] px-2 shadow-[4px_4px_0_#161616]"
                                    onClick={() => setIsTelemetryOpen(true)}
                                    type="button"
                                    title="Open Live Telemetry"
                                    aria-label="Open Live Telemetry"
                                    aria-expanded="false"
                                >
                                    <Activity size={20} strokeWidth={3} />
                                    <span className="text-xs font-black">
                                        {metrics.avgLatency
                                            ? `${metrics.avgLatency}ms`
                                            : '--'}
                                    </span>
                                </button>
                            )}
                        </div>

                        {isTelemetryOpen && (
                            <>
                                <div className="fixed inset-0 z-[90000]" onClick={() => setIsTelemetryOpen(false)} />
                                <div className="absolute top-4 left-4 bg-[#fffdf5] border-[3px] border-[#161616] shadow-[4px_4px_0_#161616] p-3 w-56 flex flex-col gap-1 z-[90001]">
                                    <div className="flex items-center justify-between border-b-[2px] border-[#161616] pb-1 mb-1">
                                        <div className="text-[10px] font-black uppercase text-[#161616]">
                                            Live Telemetry
                                        </div>
                                        <button
                                            className="p-0.5 text-[#161616] hover:text-[#ff4fa3]"
                                            onClick={() =>
                                                setIsTelemetryOpen(false)
                                            }
                                            type="button"
                                            title="Collapse Live Telemetry"
                                            aria-label="Collapse Live Telemetry"
                                            aria-expanded="true"
                                        >
                                            <X size={14} strokeWidth={3} />
                                        </button>
                                    </div>

                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-bold text-[#161616]/70">
                                            Avg Latency
                                        </span>
                                        <span
                                            className="font-black"
                                            style={{
                                                color:
                                                    metrics.avgLatency > 1500
                                                        ? '#ff6b6b'
                                                        : metrics.avgLatency >
                                                            800
                                                          ? '#ffad66'
                                                          : '#9cf57a',
                                            }}
                                        >
                                            {metrics.avgLatency
                                                ? `${metrics.avgLatency}ms`
                                                : '--'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-bold text-[#161616]/70">
                                            P95 Estimate
                                        </span>
                                        <span className="font-black text-[#ffad66]">
                                            {metrics.p95Latency
                                                ? `${metrics.p95Latency}ms`
                                                : '--'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-bold text-[#161616]/70">
                                            P50 / P99
                                        </span>
                                        <span className="font-black text-[#a18cff]">
                                            {metrics.p50Latency &&
                                            metrics.p99Latency
                                                ? `${metrics.p50Latency} / ${metrics.p99Latency}ms`
                                                : '--'}
                                        </span>
                                    </div>

                                    {Object.keys(metrics.latencyBreakdown)
                                        .length > 0 && (
                                        <div className="mt-1 border-t-[2px] border-[#161616] pt-1">
                                            <div className="mb-1 text-[10px] font-black uppercase text-[#161616]/70">
                                                Latency Contributors
                                            </div>
                                            {Object.entries(
                                                metrics.latencyBreakdown,
                                            )
                                                .sort(
                                                    ([, first], [, second]) =>
                                                        second - first,
                                                )
                                                .slice(0, 4)
                                                .map(([label, value]) => (
                                                    <div
                                                        key={label}
                                                        className="flex justify-between gap-2 text-[11px] font-bold"
                                                    >
                                                        <span className="truncate">
                                                            {label}
                                                        </span>
                                                        <span className="shrink-0 text-[#ff4fa3]">
                                                            {Math.round(
                                                                value /
                                                                    Math.max(
                                                                        1,
                                                                        metrics.completedRequests,
                                                                    ),
                                                            )}
                                                            ms
                                                        </span>
                                                    </div>
                                                ))}
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-bold text-[#161616]/70">
                                            Total Requests
                                        </span>
                                        <span className="font-black text-[#5de2e7]">
                                            {metrics.totalRequests}
                                        </span>
                                    </div>

                                    {Object.keys(metrics.statusCodes).length > 0 ? (
                                        <div className="mt-1 border-t-[2px] border-[#161616] pt-1">
                                            <div className="mb-1 text-[10px] font-black uppercase text-[#161616]/70">
                                                Status Codes
                                            </div>
                                            {Object.entries(metrics.statusCodes).map(([code, count]) => {
                                                const codeNum = parseInt(code, 10);
                                                const color = codeNum >= 500 ? '#ff6b6b' : codeNum >= 400 ? '#ffad66' : '#9cf57a';
                                                return (
                                                    <div key={code} className="flex justify-between items-center text-[11px] font-bold">
                                                        <span style={{ color }}>{code}</span>
                                                        <span className="text-[#161616]">{count}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-bold text-[#161616]/70">
                                                Error Rate
                                            </span>
                                            <span className="font-black text-[#ff4fa3]">
                                                {metrics.totalRequests > 0
                                                    ? `${Math.round((metrics.totalErrors / metrics.totalRequests) * 100)}%`
                                                    : '0%'}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-bold text-[#161616]/70">
                                            In Flight
                                        </span>
                                        <span className="font-black text-[#a18cff]">
                                            {metrics.inFlightRequests}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-bold text-[#161616]/70">
                                            Throughput
                                        </span>
                                        <span className="font-black text-[#5de2e7]">
                                            {metrics.throughputPerSecond}/s
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-bold text-[#161616]/70">
                                            Dropped
                                        </span>
                                        <span className="font-black text-[#ff6b6b]">
                                            {metrics.droppedRequests}
                                        </span>
                                    </div>
                                </div>
                                </>
                            )}
                        {propertiesNodeId && (
                            <NodePropertiesPanel
                                nodeId={propertiesNodeId}
                                nodes={
                                    nodes.filter(
                                        (n) => n.type === 'architecture',
                                    ) as ArchitectureFlowNode[]
                                }
                                edges={edges}
                                onUpdateNode={onUpdateNode}
                                technologies={technologies}
                                onDeleteNode={(id) => {
                                    setNodes((nds) => nds.filter((n) => n.id !== id));
                                    // Also remove any connected edges
                                    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
                                    setPropertiesNodeId(undefined);
                                }}
                                onClose={() => {
                                    setPropertiesNodeId(undefined);
                                }}
                            />
                        )}
                        {propertiesEdgeId &&
                            edges.some((e) => e.id === propertiesEdgeId) && (
                                <EdgePropertiesPanel onShowProtocolInfo={setInfoData}
                                    edge={
                                        edges.find(
                                            (e) => e.id === propertiesEdgeId,
                                        )!
                                    }
                                    onSave={(id, data) => {
                                        setEdges((eds) =>
                                            eds.map((e) =>
                                                e.id === id
                                                    ? {
                                                          ...e,
                                                          data: {
                                                              ...e.data,
                                                              ...data,
                                                          } as EventEdgeData,
                                                      }
                                                    : e,
                                            ),
                                        );
                                        setPropertiesEdgeId(undefined);
                                    }}
                                    onDelete={(id) => {
                                        setEdges((eds) =>
                                            eds.filter((e) => e.id !== id),
                                        );
                                        setPropertiesEdgeId(undefined);
                                    }}
                                    onClose={() =>
                                        setPropertiesEdgeId(undefined)
                                    }
                                />
                            )}
                        <ReactFlow<AppNode, EventFlowEdge>
                            nodes={nodes.map((n) =>
                                n.type === 'architecture'
                                    ? {
                                          ...n,
                                          data: {
                                              ...n.data,
                                              isBottleneck:
                                                  bottleneckNodes?.has(n.id),
                                              queueLength:
                                                  nodeQueues?.[n.id]?.length || 0,
                                              isFrozen: frozenNodes?.has(n.id),
                                              isOffline: offlineNodes?.has(n.id),
                                              isHighlightedError: highlightedErrorNodeIds.includes(n.id),
                                          },
                                      }
                                    : n,
                            )}
                            edges={edges.map(e => ({
                                ...e,
                                data: {
                                    ...e.data,
                                    isHighlightedError: highlightedErrorEdgeIds.includes(e.id),
                                } as EventFlowEdge['data']
                            }))}
                            nodeTypes={nodeTypes}
                            edgeTypes={edgeTypes}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onDrop={onDrop}
                            onDragOver={(event) => {
                                event.preventDefault();
                                event.dataTransfer.dropEffect = 'copy';
                            }}
                            onEdgeClick={useCallback(
                                (
                                    event: React.MouseEvent,
                                    edge: EventFlowEdge,
                                ) => {
                                    setPropertiesEdgeId(edge.id);
                                },
                                [],
                            )}
                            onNodeDoubleClick={useCallback(
                                (event: React.MouseEvent, node: AppNode) => {
                                    setPropertiesNodeId(node.id);
                                },
                                [],
                            )}
                            onNodeDragStop={(event, node) => {
                                if (node.type === 'boundary') return;

                                const intersections =
                                    flowInstance
                                        ?.getIntersectingNodes(node)
                                        .filter((n) => n.type === 'boundary') ||
                                    [];
                                const targetBoundary = intersections[0];

                                if (targetBoundary) {
                                    if (node.parentId !== targetBoundary.id) {
                                        setNodes((nds) =>
                                            nds.map((n) => {
                                                if (n.id === node.id) {
                                                    const relX =
                                                        node.position.x -
                                                        targetBoundary.position
                                                            .x;
                                                    const relY =
                                                        node.position.y -
                                                        targetBoundary.position
                                                            .y;
                                                    return {
                                                        ...n,
                                                        parentId:
                                                            targetBoundary.id,
                                                        position: {
                                                            x: relX,
                                                            y: relY,
                                                        },
                                                    };
                                                }
                                                return n;
                                            }),
                                        );
                                    }
                                } else if (node.parentId) {
                                    setNodes((nds) => {
                                        const parent = nds.find(
                                            (p) => p.id === node.parentId,
                                        );
                                        return nds.map((n) => {
                                            if (n.id === node.id) {
                                                const absX =
                                                    node.position.x +
                                                    (parent?.position.x || 0);
                                                const absY =
                                                    node.position.y +
                                                    (parent?.position.y || 0);
                                                return {
                                                    ...n,
                                                    parentId: undefined,
                                                    position: {
                                                        x: absX,
                                                        y: absY,
                                                    },
                                                };
                                            }
                                            return n;
                                        });
                                    });
                                }
                            }}
                            onPaneClick={() => {
                                setSelectedEdgeId(undefined);
                                setPropertiesNodeId(undefined);
                            }}
                            onInit={(instance) => {
                                setFlowInstance(instance);
                                window.setTimeout(
                                    () => instance.fitView({ padding: 0.2 }),
                                    0,
                                );
                            }}
                            connectionLineType={ConnectionLineType.Bezier}
                            connectionLineStyle={{
                                stroke: '#161616',
                                strokeWidth: 3,
                            }}
                            defaultEdgeOptions={{
                                markerEnd: {
                                    type: MarkerType.ArrowClosed,
                                    width: 16,
                                    height: 16,
                                    color: '#161616',
                                },
                            }}
                            fitView
                            deleteKeyCode={['Backspace', 'Delete']}
                            proOptions={{ hideAttribution: true }}
                            minZoom={0.01}
                            maxZoom={100}
                        >
                            <Background color="#161616" gap={22} size={1} />
                            
                            <svg className="absolute w-0 h-0">
                                <defs>
                                    <filter id="motion-blur" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="3 0" />
                                    </filter>
                                </defs>
                            </svg>

                            <CustomCanvasControls />
                        </ReactFlow>
                        {isLogWindowOpen ? (
                            <>
                                <div className="fixed inset-0 z-[90000]" onClick={() => setIsLogWindowOpen(false)} />
                                <div className={`absolute bottom-4 right-4 z-[90001] flex w-[400px] flex-col overflow-hidden border-[3px] border-[#161616] bg-white shadow-[6px_6px_0_#161616] ${propertiesNodeId || propertiesEdgeId || infoData ? 'hidden' : ''}`}>
                                <div className="flex justify-between items-center border-b-[3px] border-[#161616] bg-[#5de2e7] px-2 py-2 text-xs font-black uppercase">
                                    <span className="flex items-center gap-1.5">
                                        <Terminal size={14} /> Process & Drop Logs
                                    </span>
                                    <button
                                        onClick={() =>
                                            setIsLogWindowOpen(false)
                                        }
                                        className="hover:text-[#ff6b6b] transition-colors"
                                    >
                                        <X size={16} strokeWidth={3} />
                                    </button>
                                </div>
                                <div className="flex border-b-[2px] border-[#161616] bg-[#fffdf5]">
                                    <button
                                        className={`flex-1 px-2 py-1 text-[10px] font-black uppercase ${terminalView === 'trace' ? 'bg-[#ffde59]' : 'bg-white'}`}
                                        onClick={() => setTerminalView('trace')}
                                        type="button"
                                    >
                                        Trace Timeline
                                    </button>
                                    <button
                                        className={`flex-1 border-l-[2px] border-[#161616] px-2 py-1 text-[10px] font-black uppercase ${terminalView === 'console' ? 'bg-[#ffde59]' : 'bg-white'}`}
                                        onClick={() =>
                                            setTerminalView('console')
                                        }
                                        type="button"
                                    >
                                        Live Console
                                    </button>
                                </div>
                                <div className="flex h-56 flex-col-reverse overflow-y-auto bg-[#161616] p-3 text-xs font-mono">
                                    {logs.length === 0 ? (
                                        <div className="text-gray-500">
                                            Waiting for packets to process...
                                        </div>
                                    ) : (
                                        [...logs].reverse().map((log) => (
                                            <div
                                                key={log.id}
                                                className="mb-1 flex items-start gap-2 break-words leading-relaxed"
                                            >
                                                {terminalView === 'trace' ? (
                                                    <span className="shrink-0 text-[#5de2e7]">
                                                        +{log.simulatedAt}ms #
                                                        {String(
                                                            log.sequence,
                                                        ).padStart(3, '0')}
                                                    </span>
                                                ) : (
                                                    <span className="shrink-0 text-gray-500">
                                                        {log.timestamp.toLocaleTimeString(
                                                            [],
                                                            {
                                                                hour12: false,
                                                                fractionalSecondDigits: 1,
                                                            },
                                                        )}
                                                    </span>
                                                )}
                                                <span
                                                    style={{ color: log.color }}
                                                >
                                                    {terminalView === 'trace'
                                                        ? `[${log.eventType.toUpperCase()}] `
                                                        : ''}
                                                    {terminalView === 'trace' &&
                                                    log.nodeId
                                                        ? `${log.nodeId} `
                                                        : ''}
                                                    {terminalView === 'trace' &&
                                                    log.requestId
                                                        ? `[${log.requestId.slice(0, 8)}] `
                                                        : ''}
                                                    {log.message}
                                                    {terminalView === 'trace' &&
                                                    log.durationMs
                                                        ? ` (${log.durationMs}ms)`
                                                        : ''}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                            </>
                        ) : (
                            <div className={`absolute bottom-4 right-4 z-50 flex items-center gap-3 ${propertiesNodeId || propertiesEdgeId || infoData ? 'hidden' : ''}`}>
                                <button
                                    onClick={() => setIsLogWindowOpen(true)}
                                    className={`neo-button flex h-10 w-10 items-center justify-center border-[3px] border-[#161616] transition-transform hover:-translate-y-1 hover:translate-x-1 hover:shadow-[0_0_0_#5de2e7] ${
                                        isLogGlowing 
                                            ? 'bg-[#ff6b6b] text-white shadow-[0_0_20px_8px_rgba(255,107,107,0.6)] animate-pulse' 
                                            : 'bg-[#161616] text-[#5de2e7] shadow-[4px_4px_0_#5de2e7]'
                                    }`}
                                    title="Open Process & Drop Logs"
                                    type="button"
                                >
                                    <Terminal size={20} strokeWidth={3} />
                                </button>
                                
                            </div>
                        )}

                        {/* Help Button and Modal */}
                        <div
                            className={`absolute top-4 right-4 z-50 ${propertiesNodeId || propertiesEdgeId || infoData ? 'hidden' : ''}`}
                        >
                            <button
                                onClick={() => setIsHelpOpen(!isHelpOpen)}
                                className="neo-button flex h-10 w-10 items-center justify-center bg-[#ffde59] border-[3px] border-[#161616] shadow-[4px_4px_0_#161616] transition-transform hover:-translate-y-1 hover:translate-x-1 hover:shadow-[0_0_0_#161616]"
                                title="Help & Legend"
                            >
                                <HelpCircle size={20} strokeWidth={3} />
                            </button>
                        </div>
                        {isHelpOpen && (
                            <div 
                                className="fixed inset-0 z-[90010] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                                onPointerDown={() => setIsHelpOpen(false)}
                            >
                                <div 
                                    className="neo-panel w-full max-w-2xl bg-white flex flex-col shadow-[12px_12px_0_#161616] max-h-[85vh] animate-in zoom-in-95 duration-200"
                                    onPointerDown={e => e.stopPropagation()}
                                >
                                    <div className="flex justify-between items-center border-b-[3px] border-[#161616] bg-[#ffde59] px-4 py-3 text-sm font-black uppercase">
                                        <span className="flex items-center gap-1.5"><HelpCircle size={20} strokeWidth={3} /> Canvas User Guide</span>
                                        <button
                                            onClick={() => setIsHelpOpen(false)}
                                            className="hover:text-[#ff6b6b] transition-colors p-1"
                                        >
                                            <X size={20} strokeWidth={3} />
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto overscroll-contain p-6 text-sm font-medium space-y-8 custom-scrollbar">

                                        <div>
                                            <h3 className="mb-2 inline-block border-[2px] border-[#161616] bg-[#ffde59] px-2 py-1 font-black uppercase shadow-[2px_2px_0_#161616]">
                                                🚀 Quick Start for Beginners
                                            </h3>
                                            <p className="mb-3 text-sm text-[#161616] font-medium">Zero knowledge about system design? No problem! Follow these 5 steps to manually build an architecture, or use the AI to do it instantly:</p>
                                            <ol className="list-decimal space-y-2 pl-5 text-sm font-bold bg-white border-[2px] border-[#161616] p-4 shadow-[4px_4px_0_#161616]">
                                                <li><b>The User:</b> Drag a <span className="text-[#9cf57a]">Client</span> (Mobile App, Web) onto the canvas to generate traffic.</li>
                                                <li><b>The Front Door:</b> Drag an <span className="text-[#5de2e7]">API Gateway</span> next to it and connect the Client to the Gateway.</li>
                                                <li><b>The Brain:</b> Drag a <span className="text-[#a18cff]">Service</span> (Node.js, Python) and connect the Gateway to it.</li>
                                                <li><b>The Memory:</b> Drag a <span className="text-[#ff4fa3]">Database</span> (Postgres) and connect the Service to it.</li>
                                                <li><b>The Magic:</b> Click the <span className="text-[#ffde59]">Play (▶)</span> button at the top and watch packets flow through the system!</li>
                                            </ol>
                                        </div>

                                        <div>
                                            <h3 className="mb-2 inline-block border-[2px] border-[#161616] bg-[#ff4fa3] text-white px-2 py-1 font-black uppercase shadow-[2px_2px_0_#161616]">
                                                ? The AI Architect Tools
                                            </h3>
                                            <p className="mb-3 text-sm text-[#161616] font-medium">Architecture Studio has an integrated Senior Principal Engineer. Let the AI do the heavy lifting!</p>
                                            <ul className="list-disc space-y-2 pl-4 text-sm font-bold">
                                                <li>
                                                    <span className="text-[#ff4fa3]">Prompt-to-Architecture:</span> Click the sparkles icon in the header. Type a description like "E-commerce backend with Postgres and Kafka", and the AI will generate the entire diagram, including nodes, wires, and internal logic routing.
                                                </li>
                                                <li>
                                                    <span className="text-[#ff4fa3]">Security & Reliability Review:</span> Click the shield icon. The AI will scan your architecture to find missing authentication, network vulnerabilities, bottlenecks, and single points of failure.
                                                </li>
                                                <li>
                                                    <span className="text-[#ff4fa3]">Logic Flow Tester:</span> Click the test tube icon. The AI runs a deep architectural scan to trace logic flow and find infinite loops, routing black holes, protocol mismatches, and missing fallbacks.
                                                </li>
                                                <li>
                                                    <span className="text-[#ff4fa3]">Chaos Parameter Sweeper:</span> Click the AI Tools Dropdown, then "Open Sweeper". The AI acts as a Chaos Monkey, systematically breaking your system (spiking latency, crashing nodes) across an infinite turn-based experimental loop. It lets you choose experiments, runs physics simulations, and generates a beautiful interactive PDF report!
                                                </li>
                                                <li>
                                                    <span className="text-[#ff4fa3]">Explain Architecture:</span> The AI can read any complex system diagram and write a plain-english architectural walkthrough of exactly how the data flows from start to finish.
                                                </li>
                                                <li>
                                                    <span className="text-[#ff4fa3]">? Auto-Resolve:</span> A smart AI repair engine! Whenever the <b>System Watchdog</b> detects a bottleneck at runtime, or the AI testers find a vulnerability, click the <span className="bg-[#5de2e7] border-2 border-[#161616] px-1">? Auto Resolve</span> button. The AI will instantly generate a patch and physically fix the architecture.
                                                </li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h3 className="mb-2 inline-block border-[2px] border-[#161616] bg-[#9cf57a] px-2 py-1 font-black uppercase shadow-[2px_2px_0_#161616]">
                                                🎮 Physics, Engine & Diagnostics
                                            </h3>
                                            <p className="mb-3 text-sm text-[#161616] font-medium">The simulation engine strictly enforces real-world computing physics. There is no hidden magic.</p>
                                            <ul className="list-disc space-y-2 pl-4 text-sm font-bold">
                                                <li>
                                                    <span className="text-green-600">Strict Latency Constraints:</span> Node processing times are mathematically calculated based on the <b>Workload</b> (Light=15ms, Normal=50ms, Heavy=150ms) plus <b>Network Hops</b> (20ms each).
                                                </li>
                                                <li>
                                                    <span className="text-green-600">Queues & Overflows (503s):</span> Every node has a maximum memory queue size defined by its <b>Concurrency</b> multiplier. If a node is processing too slowly and its queue fills up, the engine drops packets and fires a red <b>503 Service Unavailable (Overflow)</b> error.
                                                </li>
                                                <li>
                                                    <span className="text-green-600">Cascading Errors:</span> If a downstream node (like a Database) fails or goes offline, it returns a 503 error up the chain. Middle microservices will catch this error and blindly forward it up to the API Gateway, and finally the Client—exactly like HTTP status codes!
                                                </li>
                                                <li>
                                                    <span className="text-green-600">System Watchdog:</span> A background diagnostic scanner actively watches your system and pops out the Warnings Drawer if it detects Deadlocks, Starvation, Missing Logic, Bottlenecks, Cache Thrashing, or Invalid Wiring.
                                                </li>
                                                <li>
                                                    <span className="text-green-600">Smooth Visuals:</span> Packets shape-shift based on protocol (🟦 blocks for HTTP, 🛢️ cylinders for SQL, ✨ dashed lines for streams). They change color based on success (🟩 Green), client error (🟨 Yellow), or server error (🟥 Red).
                                                </li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h3 className="mb-2 inline-block border-[2px] border-[#161616] bg-[#a18cff] text-white px-2 py-1 font-black uppercase shadow-[2px_2px_0_#161616]">
                                                🛠️ Manual Configuration & Logic
                                            </h3>
                                            <p className="mb-3 text-sm text-[#161616] font-medium">Nodes are "dumb" by default. You (or the AI) must tell them exactly how to route traffic.</p>
                                            <ul className="list-disc space-y-2 pl-4 text-sm font-bold">
                                                <li><b>Double-Click a Node:</b> Opens its Logic & Physics panel.</li>
                                                <li><b>Define Logic Steps:</b> Add steps like <i>"Simulate Cache"</i>, <i>"If Hit &rarr; Reply"</i>, <i>"If Miss &rarr; Forward to Database"</i>. You must handle both <code>on-success</code> and <code>on-error</code> conditions to properly route responses back to the caller!</li>
                                                <li><b>Wire Protocols:</b> Click any wire to open the Wire Settings. You can change its label, specify the exact protocol (WebSocket, Kafka, gRPC), and adjust its shape (curve vs step).</li>
                                                <li><b>Chaos Monkey 🐒:</b> Click the Chaos button in the header to randomly knock a backend node offline for 5 seconds to test your system's resilience (expect 502 Bad Gateway errors).</li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h3 className="mb-2 inline-block border-[2px] border-[#161616] bg-[#ffad66] px-2 py-1 font-black uppercase shadow-[2px_2px_0_#161616]">
                                                🎛️ Header & Toolbar Controls
                                            </h3>
                                            <ul className="list-disc space-y-1.5 pl-4 text-sm font-bold">
                                                <li><b>RPS:</b> Requests Per Second (how fast the client generates traffic).</li>
                                                <li><b>Max Active:</b> Caps the total number of packets allowed in-flight at once to prevent browser lag.</li>
                                                <li><b>Total Limit:</b> Hard limit on total packets sent before the simulation auto-stops.</li>
                                                <li><b>Speed (1x-100x):</b> Speeds up the visual rendering time without changing the mathematical latency values of the physics engine.</li>
                                                <li><b>Record:</b> Captures a one-cycle WebM walkthrough of the flow!</li>
                                                <li><b>Step:</b> Manually advance the simulation exactly one tick at a time.</li>
                                                <li><b>Auto-Layout:</b> Automatically arrange your canvas nodes directionally.</li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h3 className="mb-2 inline-block border-[2px] border-[#161616] bg-[#ff4fa3] px-2 py-1 font-black uppercase text-white shadow-[2px_2px_0_#161616]">
                                                Technology Library
                                            </h3>
                                            <ul className="list-disc space-y-1.5 pl-4 text-sm font-bold">
                                                <li>
                                                    <b>Search technologies</b>{' '}
                                                    by product name or
                                                    description, then open a
                                                    category with its arrow.
                                                </li>
                                                <li>
                                                    <b>
                                                        Drag a technology card
                                                    </b>{' '}
                                                    onto an empty canvas area.
                                                    Its icon and color identify
                                                    its system category.
                                                </li>
                                                <li>
                                                    <b>Categories:</b> clients
                                                    start requests; network
                                                    components route traffic;
                                                    services run application
                                                    logic; data and storage
                                                    persist information; caches
                                                    serve fast lookups;
                                                    messaging handles
                                                    asynchronous work.
                                                </li>
                                                <li>
                                                    <b>Boundaries</b> group
                                                    components inside VPCs,
                                                    subnets, regions,
                                                    availability zones, or
                                                    Kubernetes clusters.
                                                </li>
                                                <li>
                                                    Hover a card to read its
                                                    description. New nodes begin
                                                    with default latency
                                                    settings that can be tuned
                                                    in their popup.
                                                </li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h3 className="mb-2 inline-block border-[2px] border-[#161616] bg-[#9cf57a] px-2 py-1 font-black uppercase shadow-[2px_2px_0_#161616]">
                                                Realistic Latency
                                            </h3>
                                            <ul className="list-disc space-y-1.5 pl-4 text-sm font-bold">
                                                <li>
                                                    Open the{' '}
                                                    <b>telemetry icon</b> in the
                                                    top-left of the canvas to
                                                    view average latency, P95,
                                                    request count, errors, and
                                                    the slowest contributors.
                                                </li>
                                                <li>
                                                    <b>Average latency</b> is
                                                    the mean modeled request
                                                    time.
                                                    <b> P95</b> is the estimated
                                                    time at or below which 95%
                                                    of modeled requests
                                                    complete.
                                                </li>
                                                <li>
                                                    <b>Double-click a node</b>{' '}
                                                    and use Realistic Latency
                                                    Model to tune workload,
                                                    cache hit rate, concurrency,
                                                    network hops, multiplier,
                                                    and extra latency.
                                                </li>
                                                <li>
                                                    These are architecture
                                                    estimates: caches are faster
                                                    than databases, storage is
                                                    slower, and extra hops add
                                                    cost. They are not
                                                    production measurements.
                                                </li>
                                                <li>
                                                    <b>Latency contributors</b>{' '}
                                                    show each node's average
                                                    contribution. A bottleneck
                                                    is a high-latency node
                                                    highlighted on the canvas.
                                                </li>
                                                <li>
                                                    <b>P50</b> is the median,{' '}
                                                    <b>P95</b> is the slower
                                                    tail, and <b>P99</b> is the
                                                    slowest one percent.{' '}
                                                    <b>In Flight</b> means
                                                    active requests,{' '}
                                                    <b>Throughput</b> means
                                                    completed requests per
                                                    simulated second, and{' '}
                                                    <b>Dropped</b> counts
                                                    requests rejected by the
                                                    in-flight limit.
                                                </li>
                                                <li>
                                                    Telemetry is estimated from
                                                    technology profiles and node
                                                    settings. Use it to compare
                                                    designs, not as a
                                                    replacement for production
                                                    monitoring.
                                                </li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h3 className="font-black uppercase bg-[#ff4fa3] text-white border-[2px] border-[#161616] px-2 py-1 inline-block mb-2 shadow-[2px_2px_0_#161616]">
                                                Running Simulations
                                            </h3>
                                            <ul className="list-disc pl-4 space-y-1.5 text-sm font-bold">
                                                <li>
                                                    Click the <b>Play button</b>{' '}
                                                    on the top menu to watch
                                                    data packets flow through
                                                    your custom architecture.
                                                </li>
                                                <li>
                                                    Click the{' '}
                                                    <b>Terminal button</b>{' '}
                                                    (cyan) to view detailed
                                                    step-by-step logs of your
                                                    node logic in action.
                                                </li>
                                                <li>
                                                    Use <b>Pause</b> to freeze
                                                    packet movement and{' '}
                                                    <b>Reset</b> to restore the
                                                    example architecture and
                                                    clear saved canvas changes.
                                                </li>
                                                <li>
                                                    Use <b>Record</b> for a
                                                    one-cycle WebM walkthrough.
                                                    Import and export JSON to
                                                    move a diagram between
                                                    sessions; PNG exports the
                                                    visible flow.
                                                </li>
                                                <li>
                                                    <b>Clear Canvas</b> in the
                                                    right sidebar removes all
                                                    nodes and wires. It does not
                                                    restore the example; use
                                                    top-bar <b>Reset</b> for
                                                    that.
                                                </li>
                                                <li>
                                                    Importing JSON replaces the
                                                    current canvas. Export JSON
                                                    first if you want to keep
                                                    the current design. Your
                                                    active diagram is also saved
                                                    locally in this browser.
                                                </li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h3 className="mb-2 inline-block border-[2px] border-[#161616] bg-[#a18cff] px-2 py-1 font-black uppercase shadow-[2px_2px_0_#161616] text-white">
                                                Information & Reference
                                            </h3>
                                            <ul className="list-disc space-y-1.5 pl-4 text-sm font-bold">
                                                <li>
                                                    <b>Info Buttons:</b> Click the <b>(i)</b> button on any tech stack card in the sidebar or any protocol in the wire settings to open the Reference Drawer.
                                                </li>
                                                <li>
                                                    <b>Reference Drawer:</b> A centralized knowledge base providing Overviews, Use Cases, Pros/Cons, and Security tradeoffs for every protocol and technology.
                                                </li>
                                            </ul>
                                        </div>



                                        <div>
                                            <h3 className="mb-2 inline-block border-[2px] border-[#161616] bg-[#ffde59] px-2 py-1 font-black uppercase shadow-[2px_2px_0_#161616]">
                                                Architecture Tools
                                            </h3>
                                            <ul className="list-disc space-y-1.5 pl-4 text-sm font-bold">
                                                <li>
                                                    <b>Architecture Stats:</b> Click <b>View Stats</b> in the Right Sidebar to see live component telemetry.
                                                </li>
                                                <li>
                                                    <b>Project Notes:</b> Click <b>Project Notes</b> to open a persistent scratchpad for architectural decisions.
                                                </li>
                                                <li>
                                                    <b>Bug Reporter:</b> Found a loophole in the physics engine? Click <b>Report Bug</b> in the right sidebar to instantly notify the engineering team so we can fix it!
                                                </li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h3 className="mb-2 inline-block border-[2px] border-[#161616] bg-[#5de2e7] px-2 py-1 font-black uppercase shadow-[2px_2px_0_#161616]">
                                                Terminal & Sequence
                                            </h3>
                                            <ul className="list-disc space-y-1.5 pl-4 text-sm font-bold">
                                                <li>
                                                    <b>Trace Timeline</b> is the
                                                    simulated order of events.
                                                    Read from oldest to newest
                                                    using sequence numbers such
                                                    as <b>#001</b>.
                                                </li>
                                                <li>
                                                    <b>Live Console</b> shows
                                                    browser wall-clock
                                                    timestamps for when the
                                                    interface rendered each log
                                                    entry.
                                                </li>
                                                <li>
                                                    Trace entries include the
                                                    simulated time, event type,
                                                    node, request ID, and
                                                    modeled duration. Entries
                                                    with the same request ID
                                                    belong to one request.
                                                </li>
                                                <li>
                                                    Packets travel on wires,
                                                    arrive at nodes, wait for
                                                    modeled processing, and then
                                                    create the next event. A
                                                    response is only sent after
                                                    its required work completes.
                                                </li>
                                                <li>
                                                    When a node fans out to
                                                    multiple destinations,
                                                    branches run in parallel and
                                                    the parent waits for the
                                                    required branch responses
                                                    before continuing.
                                                </li>
                                                <li>
                                                    Use <b>Step</b> to inspect
                                                    the queue: first click from
                                                    idle prepares a paused run,
                                                    then each click processes
                                                    one event. Use <b>Play</b>{' '}
                                                    to leave step mode and
                                                    continue continuously.
                                                </li>
                                            
                                                <li>
                                                    <b>Live Telemetry:</b> The HUD at the bottom of the screen tracks real-time RPS, Average Latency, and Error rates as packets travel.
                                                </li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h3 className="mb-2 inline-block border-[2px] border-[#161616] bg-[#5de2e7] px-2 py-1 font-black uppercase shadow-[2px_2px_0_#161616]">
                                                ▶️ Playback & Controls
                                            </h3>
                                            <ul className="list-disc space-y-1.5 pl-4 text-sm font-bold">
                                                <li><b>Play / Pause:</b> Toggle the continuous stream of automated traffic.</li>
                                                <li><b>Run Once / Step:</b> Perfect for debugging! Click "Run Once" to fire a single isolated request, and "Step" while paused to move packets forward frame-by-frame.</li>
                                                <li><b>Speed:</b> Visual playback speed (0.5x to 3x). Doesn't affect actual physics!</li>
                                                <li><b>Chaos Monkey 🐒:</b> Test system resilience! Target a specific node (or choose RANDOM), and click Chaos to forcefully take it OFFLINE for a set duration.</li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h3 className="mb-2 inline-block border-[2px] border-[#161616] bg-white px-2 py-1 font-black uppercase shadow-[2px_2px_0_#161616]">
                                                📚 Terminology & Metrics
                                            </h3>
                                            <ul className="list-disc space-y-1.5 pl-4 text-sm font-bold">
                                                <li><b>Throughput (RPS):</b> Rate of requests injected by Clients per simulated second.</li>
                                                <li><b>Latency (Average, P95, P99):</b> How long a request takes round-trip. P99 shows the latency for your worst 1% of users.</li>
                                                <li><b>Max Active:</b> The hard limit of simultaneous packets allowed in the system. Beyond this, packets are aggressively dropped.</li>
                                                <li><b>Limit:</b> The absolute total packets to simulate before Auto-Stopping (leave empty for ∞).</li>
                                                <li><b>Bottleneck:</b> A node that is processing requests slower than they are arriving (indicated by an orange glowing outline).</li>
                                                <li><b>Cache Thrashing:</b> A cache node with a low hit-rate, rendering it useless while adding network delay.</li>
                                                <li><b>Deadlock:</b> An infinite routing loop (Node A &rarr; Node B &rarr; Node A) that traps packets forever.</li>
                                                <li><b>Starvation:</b> When incoming traffic exceeds processing speed, causing the internal memory queue to overflow (503 Error).</li>
                                                <li><b>Telemetry HUD:</b> The live dashboard showing Total Requests, In Flight packets, Dropped packets, and HTTP Status Codes breakdown.</li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h3 className="mb-2 inline-block border-[2px] border-[#161616] bg-[#161616] text-[#9cf57a] px-2 py-1 font-black uppercase shadow-[2px_2px_0_#161616]">
                                                🎨 Visual Glossary
                                            </h3>
                                            <ul className="list-disc space-y-2 pl-4 text-sm font-bold">
                                                <li><b>Packets (Data):</b> HTTP traffic flows as solid 🟦 Squares. Database queries flow as 🛢️ Cylinders (using standard database protocol). Streaming protocols flow as animated ✨ Dashed Lines.</li>
                                                <li><b>Packet Colors:</b> 🟩 Green indicates a successful 200 OK response. 🟨 Yellow indicates a 4xx Client Error (e.g. Cache Miss). 🟥 Red indicates a critical 5xx Server Error or Queue Overflow.</li>
                                                <li><b>Nodes (Components):</b> Solid boxes with thick borders. Their color represents their category (e.g., Pink for Network/API Gateways, Blue for Microservices, Green for Databases).</li>
                                                <li><b>Boundaries (VPCs):</b> Large transparent boxes with dashed borders. Use these to visually group elements into AWS Regions, Subnets, or Kubernetes Clusters.</li>
                                                <li><b>Wires:</b> You can customize wire styles! Double click a wire to change it from a smooth Bezier curve to a strict Step layout or straight line.</li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h3 className="mb-2 inline-block border-[2px] border-[#161616] bg-[#ff6b6b] px-2 py-1 font-black uppercase shadow-[2px_2px_0_#161616]">
                                                Troubleshooting
                                            </h3>
                                            <ul className="list-disc space-y-1.5 pl-4 text-sm font-bold">
                                                <li>
                                                    <b>No packets:</b> check
                                                    that a client has at least
                                                    one outgoing connection and
                                                    that the flow is connected
                                                    in the pink-handle to
                                                    yellow-handle direction.
                                                </li>
                                                <li>
                                                    <b>Step is disabled:</b>{' '}
                                                    click Step once while idle
                                                    to prepare the paused queue,
                                                    then click it again to
                                                    advance an event. While
                                                    playing, pause first.
                                                </li>
                                                <li>
                                                    <b>Flow is paused:</b> click
                                                    Play to resume the existing
                                                    queue. Click Run Once only
                                                    when you intentionally want
                                                    to discard the current run
                                                    and start a fresh request.
                                                </li>
                                                <li>
                                                    <b>Requests are dropped:</b>{' '}
                                                    lower RPS or increase Max In
                                                    Flight. Dropped requests are
                                                    counted in telemetry and do
                                                    not enter the flow.
                                                </li>
                                                <li>
                                                    <b>High latency:</b> open a
                                                    node and reduce workload,
                                                    concurrency, network hops,
                                                    multiplier, or additional
                                                    latency. Databases and
                                                    storage normally cost more
                                                    than caches.
                                                </li>
                                                <li>
                                                    <b>Unexpected result:</b>{' '}
                                                    open the Trace Timeline,
                                                    follow one request ID, and
                                                    inspect the first error or
                                                    cache miss before changing
                                                    the diagram.
                                                </li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h3 className="font-black uppercase bg-gray-200 border-[2px] border-[#161616] px-2 py-1 inline-block mb-3 shadow-[2px_2px_0_#161616]">
                                                Packet Legend
                                            </h3>
                                            <div className="flex flex-col gap-2 text-sm font-bold">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-5 h-4 bg-[#ffde59] border-[2px] border-[#161616] inline-block rounded-[4px]"></span>{' '}
                                                    <b>
                                                        Incoming / Base Request
                                                    </b>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-5 h-4 bg-[#ff4fa3] border-[2px] border-[#161616] inline-block rounded-[4px]"></span>{' '}
                                                    <b>
                                                        Forwarded / Sub-Request
                                                    </b>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-5 h-4 bg-[#9cf57a] border-[2px] border-[#161616] inline-block rounded-[4px]"></span>{' '}
                                                    <b>
                                                        Success Response / Hit
                                                    </b>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-5 h-4 bg-[#ff6b6b] border-[2px] border-[#161616] inline-block rounded-[4px]"></span>{' '}
                                                    <b>Error Response / Miss</b>
                                                </div>
                                                <div className="mt-2 border-t-[2px] border-[#161616] pt-2">
                                                    <div className="mb-1 text-xs font-black uppercase">
                                                        Canvas Marks
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="h-4 w-5 border-[3px] border-[#ff4fa3] bg-white"></span>
                                                        <b>
                                                            Pink outline:
                                                            selected node
                                                        </b>
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-1.5">
                                                        <span className="h-4 w-5 border-[2px] border-[#161616] bg-[#ffad66]"></span>
                                                        <b>
                                                            Orange glow: latency
                                                            bottleneck
                                                        </b>
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-1.5">
                                                        <span className="h-4 w-5 border-[2px] border-dashed border-[#161616] bg-[#fffdf5]"></span>
                                                        <b>
                                                            Dashed area:
                                                            architecture
                                                            boundary
                                                        </b>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    </div>
                                </div>
                            )}
                    </section>

                    <aside className="neo-panel w-full shrink-0 bg-[#fffdf5] lg:w-72 lg:overflow-y-auto">
                        <div className="border-b-[3px] border-[#161616] bg-[#a18cff] px-4 py-3">
                            <h2 className="m-0 text-sm font-black uppercase tracking-wide">
                                Canvas Tools
                            </h2>
                            <p className="m-0 mt-1 text-xs font-bold">
                                Manage your architecture diagram.
                            </p>
                        </div>
                        <div className="p-4">
                            <div>
                                <div className="border-[3px] border-[#161616] bg-white p-3 shadow-[4px_4px_0_#161616]">
                                    <p className="m-0 text-xs font-black uppercase">
                                        Import / Export
                                    </p>
                                    <p className="m-0 mt-1 text-xs font-semibold leading-relaxed">
                                        Move diagrams between sessions or save a
                                        visual copy of the current canvas.
                                    </p>
                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        <label className="neo-button flex cursor-pointer items-center justify-center gap-1 border-[3px] border-[#161616] bg-[#5de2e7] px-2 py-2 text-xs font-black uppercase shadow-[2px_2px_0_#161616] hover:bg-[#48c9ce]">
                                            <Upload size={14} strokeWidth={3} />
                                            Import
                                            <input
                                                type="file"
                                                accept=".json"
                                                className="hidden"
                                                onChange={handleImportJSON}
                                            />
                                        </label>
                                        <button
                                            className="neo-button flex items-center justify-center gap-1 border-[3px] border-[#161616] bg-[#fffdf5] px-2 py-2 text-xs font-black uppercase shadow-[2px_2px_0_#161616] hover:bg-[#f0eed8]"
                                            onClick={handleExportJSON}
                                            title="Export JSON"
                                            type="button"
                                        >
                                            <Download
                                                size={14}
                                                strokeWidth={3}
                                            />{' '}
                                            JSON
                                        </button>
                                        <button
                                            className="neo-button flex items-center justify-center gap-1 border-[3px] border-[#161616] bg-[#fffdf5] px-2 py-2 text-xs font-black uppercase shadow-[2px_2px_0_#161616] hover:bg-[#f0eed8]"
                                            onClick={handleExportPNG}
                                            title="Export PNG"
                                            type="button"
                                        >
                                            <ImageIcon
                                                size={14}
                                                strokeWidth={3}
                                            />{' '}
                                            PNG
                                        </button>
                                        {isRecording ? (
                                            <button
                                                disabled
                                                className="neo-button flex items-center justify-center gap-1 border-[3px] border-[#161616] bg-[#ff6b6b] px-2 py-2 text-xs font-black uppercase shadow-[2px_2px_0_#161616] animate-pulse"
                                                type="button"
                                            >
                                                <Video
                                                    size={14}
                                                    strokeWidth={3}
                                                />{' '}
                                                Recording
                                            </button>
                                        ) : (
                                            <button
                                                className="neo-button flex items-center justify-center gap-1 border-[3px] border-[#161616] bg-[#a18cff] px-2 py-2 text-xs font-black uppercase shadow-[2px_2px_0_#161616] hover:bg-[#8d78ed]"
                                                onClick={handleStartRecording}
                                                title="Record WebM Video"
                                                type="button"
                                            >
                                                <Video
                                                    size={14}
                                                    strokeWidth={3}
                                                />{' '}
                                                Record
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <button
                                    className="neo-button mt-5 flex w-full items-center justify-center gap-2 border-[3px] border-[#161616] bg-[#ff4fa3] px-2 py-2 text-sm font-black uppercase shadow-[3px_3px_0_#161616]"
                                    onClick={() => {
                                        setNodes([]);
                                        setEdges([]);
                                        resetToolsState();
                                        resetSimulationState();
                                    }}
                                    type="button"
                                >
                                    <Eraser size={16} strokeWidth={3} /> Clear
                                    Canvas
                                </button>
                            </div>
                            
                            <div className="mt-6 flex flex-col gap-3">
                                <button
                                    onClick={() => setIsStatsOpen(true)}
                                    className="neo-button flex w-full items-center justify-center gap-2 border-[3px] border-[#161616] bg-[#ffde59] px-2 py-3 text-sm font-black uppercase shadow-[3px_3px_0_#161616] hover:bg-[#ebd05c]"
                                    type="button"
                                >
                                    <BarChart size={18} strokeWidth={3} /> View Stats
                                </button>
                                <button
                                    onClick={() => setIsNotesOpen(true)}
                                    className="neo-button flex w-full items-center justify-center gap-2 border-[3px] border-[#161616] bg-[#5de2e7] px-2 py-3 text-sm font-black uppercase shadow-[3px_3px_0_#161616] hover:bg-[#48c9ce]"
                                    type="button"
                                >
                                    <FileText size={18} strokeWidth={3} /> Project Notes
                                </button>
                                <button
                                    onClick={() => setIsFeedbackOpen(true)}
                                    className="neo-button flex w-full items-center justify-center gap-2 border-[3px] border-[#161616] bg-white px-2 py-3 text-sm font-black uppercase shadow-[3px_3px_0_#161616] hover:bg-gray-50"
                                    type="button"
                                >
                                    <AlertTriangle size={18} strokeWidth={3} className="text-[#ff6b6b]" /> Report Bug
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>

                {/* Floating Validation Toasts */}
                <div className="pointer-events-none fixed bottom-20 right-6 z-[9999] flex flex-col gap-2">
                    {toasts.map((toast) => (
                        <div
                            key={toast.id}
                            className="flex items-center gap-3 border-[3px] border-[#161616] bg-[#ff6b6b] px-4 py-3 text-sm font-black text-[#161616] shadow-[4px_4px_0_#161616] transition-all"
                        >
                            <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#161616] bg-white font-bold">
                                !
                            </div>
                            {toast.message}
                        </div>
                    ))}
                </div>
                {/* Stats Modal */}
                {isStatsOpen && (
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setIsStatsOpen(false)}>
                        <div className="w-full max-w-sm bg-[#fffdf5] border-[3px] border-[#161616] shadow-[12px_12px_0_#161616] flex flex-col animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between border-b-[3px] border-[#161616] p-4 bg-[#ffde59]">
                                <h2 className="font-black uppercase tracking-wider text-lg flex items-center gap-1.5"><BarChart size={20} strokeWidth={3}/> Architecture Stats</h2>
                                <button onClick={() => setIsStatsOpen(false)} className="neo-button p-1.5 hover:bg-white bg-white/50" title="Close"><X size={18} strokeWidth={3} /></button>
                            </div>
                            <div className="p-6 flex flex-col gap-3 text-sm font-bold">
                                <div className="flex justify-between items-center border-b-[2px] border-[#161616] pb-2">
                                    <span>Total Components</span>
                                    <span className="bg-[#ffde59] px-2 py-0.5 border-[2px] border-[#161616]">{nodes.length}</span>
                                </div>
                                <div className="flex justify-between items-center border-b-[2px] border-[#161616] pb-2">
                                    <span>Connections</span>
                                    <span className="bg-[#ffde59] px-2 py-0.5 border-[2px] border-[#161616]">{edges.length}</span>
                                </div>
                                <div className="flex justify-between items-center border-b-[2px] border-[#161616] pb-2">
                                    <span>Compute & Services</span>
                                    <span className="bg-[#5de2e7] px-2 py-0.5 border-[2px] border-[#161616]">{nodes.filter(n => {
                                        if (n.type !== 'architecture') return false;
                                        const tech = technologyLibrary.find(t => t.id === n.data.technologyId);
                                        return tech && ['compute', 'service'].includes(tech.category);
                                    }).length}</span>
                                </div>
                                <div className="flex justify-between items-center border-b-[2px] border-[#161616] pb-2">
                                    <span>Data & Storage</span>
                                    <span className="bg-[#ff4fa3] text-white px-2 py-0.5 border-[2px] border-[#161616]">{nodes.filter(n => {
                                        if (n.type !== 'architecture') return false;
                                        const tech = technologyLibrary.find(t => t.id === n.data.technologyId);
                                        return tech && ['data', 'storage', 'cache'].includes(tech.category);
                                    }).length}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Clients</span>
                                    <span className="bg-[#a18cff] px-2 py-0.5 border-[2px] border-[#161616]">{nodes.filter(n => {
                                        if (n.type !== 'architecture') return false;
                                        const tech = technologyLibrary.find(t => t.id === n.data.technologyId);
                                        return tech && tech.category === 'client';
                                    }).length}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notes Modal */}
                {isNotesOpen && (
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setIsNotesOpen(false)}>
                        <div className="w-full max-w-2xl bg-[#fffdf5] border-[3px] border-[#161616] shadow-[12px_12px_0_#161616] flex flex-col animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between border-b-[3px] border-[#161616] p-4 bg-[#5de2e7]">
                                <h2 className="font-black uppercase tracking-wider text-lg flex items-center gap-1.5"><FileText size={20} strokeWidth={3}/> Project Notes</h2>
                                <button onClick={() => setIsNotesOpen(false)} className="neo-button p-1.5 hover:bg-white bg-white/50" title="Close"><X size={18} strokeWidth={3} /></button>
                            </div>
                            <div className="p-4">
                                <textarea
                                    className="neo-input w-full min-h-[300px] p-3 text-sm font-bold leading-relaxed resize-y custom-scrollbar"
                                    placeholder="Jot down architectural decisions, requirements, or deployment notes here..."
                                    value={projectNotes}
                                    onChange={(e) => setProjectNotes(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="border-t-[3px] border-[#161616] p-4 bg-gray-50 flex justify-end gap-3">
                                <button onClick={downloadNotesTxt} className="neo-button flex items-center gap-1.5 bg-white border-[3px] border-[#161616] px-4 py-2 text-xs font-black uppercase shadow-[2px_2px_0_#161616] hover:bg-[#ffde59]">
                                    <Download size={16} strokeWidth={3}/> Download .TXT
                                </button>
                                <button onClick={downloadNotesJson} className="neo-button flex items-center gap-1.5 bg-white border-[3px] border-[#161616] px-4 py-2 text-xs font-black uppercase shadow-[2px_2px_0_#161616] hover:bg-[#a18cff]">
                                    <Download size={16} strokeWidth={3}/> Download .JSON
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <AiPromptModal
                    isOpen={isAiModalOpen}
                    onClose={() => {
                        setIsAiModalOpen(false);
                        cancelGeneration();
                        clearError();
                    }}
                    onCancel={cancelGeneration}
                    isGenerating={isGenerating}
                    progress={progress}
                    error={aiError}
                    onGenerate={async (prompt) => {
                        try {
                            const result = await generate(prompt, technologies);
                            if (result) {
                                setNodes(result.nodes);
                                setEdges(result.edges);
                                resetToolsState();
                                resetSimulationState();
                                window.setTimeout(() => {
                                    if (flowInstance) {
                                        flowInstance.fitView({ padding: 0.2, duration: 800 });
                                    }
                                }, 100);
                                setIsAiModalOpen(false);
                            }
                        } catch (err) {
                            // Error is handled by the hook and displayed in the modal
                        }
                    }}
                />
                {/* Auto Layout Modal */}
                {isAutoLayoutModalOpen && (
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setIsAutoLayoutModalOpen(false)}>
                        <div className="w-full max-w-md bg-[#fffdf5] border-[3px] border-[#161616] shadow-[12px_12px_0_#161616] flex flex-col animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between border-b-[3px] border-[#161616] p-4 bg-[#5de2e7]">
                                <h2 className="font-black uppercase tracking-wider text-xl flex items-center gap-1.5"><Layout size={24} strokeWidth={3}/> Auto Layout</h2>
                                <button onClick={() => setIsAutoLayoutModalOpen(false)} className="neo-button p-1.5 bg-white border-[2px] border-[#161616] hover:-translate-y-1 hover:translate-x-1 hover:shadow-none shadow-[2px_2px_0_#161616]" title="Close"><X size={18} strokeWidth={3} /></button>
                            </div>
                            <div className="p-6 flex flex-col gap-6">
                                <div className="flex flex-col gap-1">
                                    <h3 className="font-black uppercase text-lg">Flow Direction</h3>
                                    <p className="text-sm font-bold text-gray-600">Choose how the algorithm should align your nodes.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {(['LR', 'TB', 'RL', 'BT'] as const).map((dir) => {
                                        const isSelected = layoutDirection === dir;
                                        const Icon = dir === 'LR' ? ArrowRight : dir === 'RL' ? ArrowLeft : dir === 'TB' ? ArrowDown : ArrowUp;
                                        const label = dir === 'LR' ? 'Left to Right' : dir === 'RL' ? 'Right to Left' : dir === 'TB' ? 'Top to Bottom' : 'Bottom to Top';
                                        
                                        return (
                                            <button
                                                key={dir}
                                                onClick={() => setLayoutDirection(dir)}
                                                className={`neo-button flex flex-col items-center justify-center gap-3 border-[3px] border-[#161616] p-4 transition-all ${
                                                    isSelected 
                                                    ? 'bg-[#ffde59] shadow-[2px_2px_0_#161616] translate-y-[2px] translate-x-[2px]' 
                                                    : 'bg-white shadow-[6px_6px_0_#161616] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[4px_4px_0_#161616]'
                                                }`}
                                            >
                                                <div className={`p-2 border-[2px] border-[#161616] rounded-sm ${isSelected ? 'bg-white' : 'bg-gray-100'}`}>
                                                    <Icon size={24} strokeWidth={3} />
                                                </div>
                                                <span className="font-black uppercase text-sm tracking-wide text-center leading-tight">{label}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                            <div className="border-t-[3px] border-[#161616] p-4 bg-gray-50 flex justify-between items-center">
                                <button onClick={() => setIsAutoLayoutModalOpen(false)} className="neo-button px-5 py-2.5 font-black uppercase bg-white border-[3px] border-[#161616] shadow-[3px_3px_0_#161616] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[2px_2px_0_#161616]">Cancel</button>
                                <button 
                                    onClick={() => {
                                        handleAutoLayout(layoutDirection);
                                        setIsAutoLayoutModalOpen(false);
                                    }} 
                                    className="neo-button flex items-center gap-1.5 px-6 py-2.5 font-black uppercase bg-[#ff4fa3] text-white border-[3px] border-[#161616] shadow-[4px_4px_0_#161616] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0_#161616]"
                                >
                                    <Layout size={18} strokeWidth={3} /> Apply Layout
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                <ExperimentModal
                    key={`experiment-${experimentResetKey}`}
                    isOpen={isExperimentModalOpen}
                    onClose={() => setIsExperimentModalOpen(false)}
                    nodes={nodes as ArchitectureFlowNode[]}
                    setNodes={setNodes as any}
                    edges={edges}
                    setEdges={setEdges}
                    metrics={metrics}
                    isPlaying={isPlaying}
                    setIsPlaying={setIsPlaying}
                    maxInFlight={maxInFlight}
                    setMaxInFlight={setMaxInFlight}
                    totalLimit={totalLimit}
                    setTotalLimit={setTotalLimit}
                    playbackSpeed={playbackSpeed}
                    setPlaybackSpeed={setPlaybackSpeed}
                    requestsPerSecond={requestsPerSecond}
                    setRequestsPerSecond={setRequestsPerSecond}
                    nodeQueues={nodeQueues}
                    edgePulses={edgePulses}
                    bottleneckNodes={bottleneckNodes}
                    resetSimulationState={resetSimulationState}
                    onFitView={() => {
                        if (flowInstance) {
                            flowInstance.fitView({ padding: 0.2, duration: 800 });
                        }
                    }}
                />
                
                <ExplainFlowModal
                    isOpen={isExplainModalOpen}
                    onClose={() => setIsExplainModalOpen(false)}
                    onCancel={() => {
                        cancelExplanation();
                        setIsExplainModalOpen(false);
                    }}
                    onGenerate={() => generateExplanation(nodes as ArchitectureFlowNode[], edges as EventFlowEdge[])}
                    onRegenerate={() => generateExplanation(nodes as ArchitectureFlowNode[], edges as EventFlowEdge[])}
                    onDownload={handleDownloadExplanation}
                    onClear={clearExplanation}
                    explanation={explanation}
                    isExplaining={isExplaining}
                    error={explainError}
                />
                
                <SecurityReviewModal
                    isOpen={isSecurityReviewModalOpen}
                    onClose={() => {
                        setIsSecurityReviewModalOpen(false);
                        cancelReview();
                    }}
                    onRunAnalysis={async () => {
                        const results = await runReview(nodes, edges);
                        if (results) {
                            setSecurityReviewResults(results);
                        }
                    }}
                    onCancel={cancelReview}
                    onDownload={handleDownloadSecurityReport}
                    onClear={() => setSecurityReviewResults(null)}
                    isAnalyzing={isAnalyzing}
                    results={securityReviewResults}
                    error={securityError}
                    onAutoResolve={(id, issue) => {
                        resolveIssue(id, issue, undefined, (explanation) => {
                            clearWarnings();
                            resetSimulationState();
                            setResolveSuccessMessage(explanation);
                            setSecurityReviewResults(prev => prev ? {
                                ...prev,
                                vulnerabilities: prev.vulnerabilities.filter(v => v.id !== id)
                            } : null);
                        });
                    }}
                    isResolving={isResolving}
                    onCancelResolve={cancelResolve}
                />
                
                <FeedbackModal 
                    isOpen={isFeedbackOpen} 
                    onClose={() => setIsFeedbackOpen(false)} 
                />
                
                <LogicTestModal
                    isOpen={isLogicTestModalOpen}
                    onClose={() => {
                        setIsLogicTestModalOpen(false);
                        setHighlightedErrorNodeIds([]);
                        setHighlightedErrorEdgeIds([]);
                        cancelTest();
                    }}
                    onRunTest={async () => {
                        setHighlightedErrorNodeIds([]);
                        setHighlightedErrorEdgeIds([]);
                        const results = await runTest(nodes, edges);
                        if (results) {
                            setLogicTestResults(results);
                        }
                    }}
                    onCancel={cancelTest}
                    onClear={() => {
                        setLogicTestResults(null);
                        setHighlightedErrorNodeIds([]);
                        setHighlightedErrorEdgeIds([]);
                    }}
                    onDownload={() => {
                        if (!logicTestResults) return;
                        
                        let markdown = `# AI Logic & Reliability Report\n\n`;
                        markdown += `**Status:** ${logicTestResults.assertions.some((a: any) => a.status === 'error') ? "ERRORS FOUND" : "PASSED"}\n\n`;
                        markdown += `${logicTestResults.summary}\n\n## Findings\n\n`;
                        
                        logicTestResults.assertions.forEach((a: any) => {
                            markdown += `### [${a.status.toUpperCase()}] ${a.title}\n`;
                            markdown += `**Category:** ${a.category}\n\n`;
                            markdown += `${a.description}\n\n`;
                            if (a.remediation) {
                                markdown += `**Remediation:** ${a.remediation}\n\n`;
                            }
                            markdown += `---\n\n`;
                        });
                        
                        const blob = new Blob([markdown], { type: 'text/markdown' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `logic-reliability-report.md`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    }}
                    onHighlightNodes={(nIds, eIds) => {
                        setHighlightedErrorNodeIds(nIds);
                        setHighlightedErrorEdgeIds(eIds);
                        setIsLogicTestModalOpen(false);
                        
                        // Focus canvas on the nodes
                        if (flowInstance && nIds.length > 0) {
                            const nodesToFocus = nodes.filter(n => nIds.includes(n.id));
                            if (nodesToFocus.length > 0) {
                                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                                nodesToFocus.forEach(n => {
                                    if (n.position.x < minX) minX = n.position.x;
                                    if (n.position.y < minY) minY = n.position.y;
                                    if (n.position.x + 150 > maxX) maxX = n.position.x + 150;
                                    if (n.position.y + 50 > maxY) maxY = n.position.y + 50;
                                });
                                flowInstance.fitBounds({ x: minX, y: minY, width: maxX - minX, height: maxY - minY }, { padding: 0.5, duration: 800 });
                            }
                        }

                        // Remove the highlight after 5 seconds
                        setTimeout(() => {
                            setHighlightedErrorNodeIds([]);
                            setHighlightedErrorEdgeIds([]);
                        }, 5000);
                    }}
                    isTesting={isTesting}
                    results={logicTestResults}
                    error={logicTestError}
                    nodes={nodes as ArchitectureFlowNode[]}
                    edges={edges}
                    onAutoResolve={(id, issue) => {
                        resolveIssue(id, issue, undefined, (explanation) => {
                            clearWarnings();
                            resetSimulationState();
                            setResolveSuccessMessage(explanation);
                            setLogicTestResults((prev: AiLogicTestResult | null) => prev ? {
                                ...prev,
                                assertions: prev.assertions.filter((a: any) => a.id !== id)
                            } : null);
                        });
                    }}
                    isResolving={isResolving}
                    onCancelResolve={cancelResolve}
                />

                {/* Warnings Drawer Trigger */}
                <div className="absolute bottom-6 right-6 z-50 flex items-end justify-end">
                    <div className="relative group">
                        <button
                            className={`neo-button w-14 h-14 rounded-full flex items-center justify-center border-[3px] border-[#161616] shadow-[4px_4px_0_#161616] transition-transform hover:-translate-y-1 ${systemWarnings.length > 0 ? 'bg-[#ffde59] animate-pulse' : 'bg-white'}`}
                            onClick={() => setIsWarningsPanelOpen(!isWarningsPanelOpen)}
                            title="System Diagnostics"
                        >
                            <AlertTriangle className={`w-7 h-7 ${systemWarnings.length > 0 ? 'text-[#ff6b6b]' : 'text-[#161616]'}`} />
                            {systemWarnings.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-[#ff4fa3] text-white text-xs font-black px-2 py-0.5 rounded-full border-[2px] border-[#161616]">
                                    {systemWarnings.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Warnings Drawer */}
                {isWarningsPanelOpen && (
                    <>
                    <div className="fixed inset-0 z-[90000]" onClick={() => setIsWarningsPanelOpen(false)} />
                    <div className="absolute right-6 bottom-24 z-[90001] w-80 max-h-[400px] flex flex-col bg-white border-[3px] border-[#161616] shadow-[8px_8px_0_#161616]">
                        <div className="flex items-center justify-between p-3 border-b-[3px] border-[#161616] bg-[#ffde59]">
                            <div className="flex items-center gap-1.5">
                                <AlertTriangle className="w-5 h-5 text-[#161616]" />
                                <h3 className="font-black text-sm uppercase">System Warnings</h3>
                            </div>
                            <button
                                onClick={() => setIsWarningsPanelOpen(false)}
                                className="p-1 hover:bg-black/10 rounded-sm transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
                            {systemWarnings.length === 0 ? (
                                <div className="text-center p-4 text-gray-500 font-bold text-sm">
                                    No warnings right now! System is running smoothly.
                                </div>
                            ) : (
                                systemWarnings.map((warning) => (
                                    <div key={warning.id} className="border-[2px] border-[#161616] p-2 bg-white relative">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-black uppercase bg-[#ff6b6b] text-white px-1 py-0.5 inline-block">
                                                {warning.type}
                                            </span>
                                            <span className="text-[10px] text-gray-500 font-bold">
                                                {warning.timestamp.toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <p className="text-xs font-bold mt-1 text-gray-700">
                                            {warning.message}
                                        </p>
                                        <button 
                                            className="mt-2 text-[10px] font-black uppercase bg-[#5de2e7] border-2 border-[#161616] px-2 py-1 flex items-center justify-center gap-1 hover:bg-[#9cf57a] w-full"
                                            onClick={() => {
                                                resolveIssue(warning.id, warning.message, warning.nodeId, (explanation) => {
                                                    clearWarnings(); // Clears the ref so it can trigger again if the fix was bad
                                                    setSystemWarnings(prev => prev.filter(w => w.id !== warning.id)); // Actually remove it from the UI
                                                    resetSimulationState();
                                                    setResolveSuccessMessage(explanation);
                                                });
                                            }}
                                            disabled={!!isResolving}
                                        >
                                            {isResolving === warning.id ? (
                                                <Loader2 size={12} strokeWidth={3} className="animate-spin" />
                                            ) : (
                                                "✨ Auto Resolve"
                                            )}
                                        </button>
                                        {isResolving === warning.id && (
                                            <button
                                                className="mt-1 text-[10px] font-black uppercase bg-[#ff6b6b] text-white border-2 border-[#161616] px-2 py-1 flex items-center justify-center gap-1 hover:bg-[#ff4f4f] w-full"
                                                onClick={(e) => { e.stopPropagation(); cancelResolve(); }}
                                            >
                                                ✕ Cancel
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                        
                        {systemWarnings.length > 0 && (
                            <div className="p-3 border-t-[3px] border-[#161616] bg-gray-50 flex justify-end">
                                <button
                                    onClick={() => {
                                        setSystemWarnings([]);
                                        clearWarnings();
                                    }}
                                    className="text-xs font-black uppercase bg-white border-[2px] border-[#161616] px-2 py-1 shadow-[2px_2px_0_#161616] hover:-translate-y-0.5 transition-transform active:translate-y-0 active:shadow-none"
                                >
                                    Clear All
                                </button>
                            </div>
                        )}
                    </div>
                    </>
                )}

                {resolveSuccessMessage && (
                    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                        <div className="bg-[#fffdf5] border-[3px] border-[#161616] shadow-[8px_8px_0_#161616] max-w-md w-full flex flex-col relative animate-in fade-in zoom-in duration-200">
                            <div className="border-b-[3px] border-[#161616] bg-[#5de2e7] px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <WandSparkles className="w-5 h-5 text-[#161616]" />
                                    <h2 className="font-black text-lg uppercase tracking-tight text-[#161616]">
                                        Issue Resolved
                                    </h2>
                                </div>
                                <button 
                                    onClick={() => setResolveSuccessMessage(null)}
                                    className="p-1 hover:bg-black/10 rounded-sm transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-5">
                                <p className="text-sm font-bold text-gray-800 leading-relaxed">
                                    {resolveSuccessMessage}
                                </p>
                            </div>
                            <div className="border-t-[3px] border-[#161616] bg-gray-50 p-4 flex justify-end">
                                <button
                                    onClick={() => setResolveSuccessMessage(null)}
                                    className="neo-button bg-[#ffde59] px-6 py-2 text-sm font-black uppercase shadow-[3px_3px_0_#161616] hover:-translate-y-0.5 transition-transform active:translate-y-0 active:shadow-none"
                                >
                                    Awesome
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            </ReactFlowProvider>
        </TechContext.Provider>
    );
}





