'use client';

import {
    technologyLibrary,
    type LogicStep,
    type NodeLatencyConfig,
    type TechnologyDefinition,
    type ProtocolDefinition,
} from '@architecture-studio/shared';
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
    projectNotes?: string;
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
    const [isSingleCycle, setIsSingleCycle] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [requestsPerSecond, setRequestsPerSecond] = useState(0.83);
    const [maxInFlightRequests, setMaxInFlightRequests] = useState(8);
    const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);

    const startContinuousSimulation = useCallback(() => {
        setIsSingleCycle(false);
        setIsPaused(false);
        setIsPlaying(true);
    }, []);

    const stopSimulation = useCallback(() => {
        setIsPlaying(false);
        setIsPaused(false);
        setIsSingleCycle(false);
    }, []);

    const startSingleCycle = useCallback(() => {
        // Stop and clear any paused or active run before starting a fresh cycle.
        setIsPlaying(false);
        setIsPaused(false);
        setIsSingleCycle(false);
        window.setTimeout(() => setIsSingleCycle(true), 0);
    }, []);

    useEffect(() => {
        if (isPlaying || isSingleCycle) {
            setIsLogWindowOpen(true);
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
                    if (saved.projectNotes) setProjectNotes(saved.projectNotes);
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
            JSON.stringify({ nodes, edges, projectNotes } satisfies StoredDiagram),
        );
    }, [edges, isHydrated, nodes, projectNotes]);

    // Advanced Simulation Engine powered by LogicSteps
    const { edgePulses, logs, metrics, bottleneckNodes, stepEvent } =
        useSimulation(
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
            maxInFlightRequests,
        );

    const stepSimulation = useCallback(() => {
        if (!isPlaying) {
            setIsSingleCycle(true);
            setIsPlaying(true);
            setIsPaused(true);
            return;
        }
        if (isPaused) stepEvent();
    }, [isPaused, isPlaying, stepEvent]);

    useEffect(() => {
        setEdges((currentEdges) =>
            currentEdges.map((edge) => {
                const pulsesForEdge = edgePulses[edge.id] || [];
                return {
                    ...edge,
                    animated: isPlaying && !isPaused, // Keep pure CSS continuous animation too!
                    data: {
                        ...edge.data,
                        event: edge.data?.event ?? 'event',
                        pulses: pulsesForEdge,
                        isPaused,
                        playbackSpeed,
                    },
                };
            }),
        );
    }, [isPlaying, isPaused, edgePulses, setEdges]);

    // Apply bottleneck styles
    useEffect(() => {
        setNodes((nds) =>
            nds.map((n) => {
                const isBottleneck = bottleneckNodes.has(n.id);
                const glowClass = isBottleneck ? ' bottleneck-glow' : '';
                const baseClass =
                    n.className?.replace(' bottleneck-glow', '') || '';
                return { ...n, className: baseClass + glowClass };
            }),
        );
    }, [bottleneckNodes, setNodes]);

    const onUpdateNode = useCallback(
        (
            nodeId: string,
            logicSteps: LogicStep[],
            processingDelay?: number,
            latency?: NodeLatencyConfig,
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

    const resetDemo = useCallback(() => {
        setIsPlaying(false);
        setIsSingleCycle(false);
        setIsPaused(false);
        setSelectedEdgeId(undefined);
        setNodes(initialNodes);
        setEdges(initialEdges);
        window.localStorage.removeItem(STORAGE_KEY);
        window.setTimeout(() => flowInstance?.fitView({ padding: 0.2 }), 0);
    }, [flowInstance, setEdges, setNodes]);

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

                    <div className="flex w-full items-center gap-3 overflow-x-auto border-t-[3px] border-[#161616] pt-3 pb-1 lg:gap-2">
                        <button
                            className="header-control neo-button flex shrink-0 items-center gap-2 bg-[#ff4fa3] px-3 text-white"
                            onClick={startSingleCycle}
                            type="button"
                            title="Run one request cycle"
                        >
                            <StepForward size={16} strokeWidth={3} />
                            <span className="hidden sm:inline">Run Once</span>
                        </button>

                        <div className="flex h-12 shrink-0 border-[3px] border-[#161616] bg-[#161616] shadow-[3px_3px_0_#161616]">
                            <button
                                className={`flex items-center gap-2 px-3 text-sm font-black uppercase transition-colors ${isPlaying ? 'bg-[#9cf57a]' : 'bg-[#fffdf5] hover:bg-[#5de2e7]'}`}
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
                                className={`flex items-center gap-2 px-3 text-sm font-black uppercase transition-colors disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:opacity-100 ${isPaused ? 'bg-[#ffde59]' : 'bg-[#fffdf5] hover:bg-[#ffde59]'}`}
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

                        <label className="header-control neo-control flex shrink-0 items-center gap-2 bg-[#f0f0f0] px-3" title="Playback speed">
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

                        <label className="header-control neo-control flex shrink-0 items-center gap-2 bg-[#f0f0f0] px-3" title="Requests per second">
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

                        <label className="header-control neo-control flex shrink-0 items-center gap-2 bg-[#f0f0f0] px-3" title="Maximum concurrent requests">
                            <span className="font-black text-gray-700 text-[10px] uppercase">Max Flight</span>
                            <input
                                className="w-14 h-7 bg-white border-[2px] border-[#161616] px-1 text-xs font-black shadow-[2px_2px_0_#161616] outline-none hover:bg-gray-50 transition-colors"
                                type="number"
                                min="1"
                                max="100"
                                value={maxInFlightRequests}
                                onChange={(event) =>
                                    setMaxInFlightRequests(
                                        Math.min(
                                            100,
                                            Math.max(
                                                1,
                                                Number(event.target.value),
                                            ),
                                        ),
                                    )
                                }
                                title="Maximum in-flight requests"
                            />
                        </label>

                        <button
                            className="header-control neo-button flex shrink-0 items-center gap-2 bg-[#5de2e7] px-3 disabled:!bg-gray-200 disabled:!text-gray-400 disabled:!border-gray-400 disabled:shadow-none disabled:translate-y-[3px] disabled:translate-x-[3px] disabled:cursor-not-allowed"
                            onClick={stepSimulation}
                            type="button"
                            title="Process one simulation event while paused"
                            disabled={isPlaying && !isPaused}
                        >
                            <StepForward size={16} strokeWidth={3} />
                            <span className="hidden sm:inline">Step</span>
                        </button>

                        <button
                            className="header-control neo-button flex shrink-0 items-center gap-2 bg-[#fffdf5] px-3"
                            onClick={resetDemo}
                            type="button"
                            title="Reset Simulation"
                        >
                            <RotateCcw size={17} strokeWidth={3} />{' '}
                            <span className="hidden sm:inline">Reset</span>
                        </button>

                        <button
                            className="header-control neo-button flex shrink-0 items-center gap-2 bg-[#ff6b6b] px-3 disabled:!bg-gray-200 disabled:!text-gray-400 disabled:!border-gray-400 disabled:shadow-none disabled:translate-y-[3px] disabled:translate-x-[3px] disabled:cursor-not-allowed"
                            onClick={stopSimulation}
                            type="button"
                            title="Stop simulation and clear active packets"
                            disabled={!isPlaying && !isPaused && !isSingleCycle}
                        >
                            <StopCircle size={16} strokeWidth={3} />
                            <span className="hidden sm:inline">Stop</span>
                        </button>
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
                            {!isTelemetryOpen ? (
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
                            ) : (
                                <div className="bg-[#fffdf5] border-[3px] border-[#161616] shadow-[4px_4px_0_#161616] p-3 w-56 flex flex-col gap-1">
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
                            )}
                        </div>
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
                                          },
                                      }
                                    : n,
                            )}
                            edges={edges}
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
                        >
                            <Background color="#161616" gap={22} size={1} />
                            
                            <CustomCanvasControls />
                        </ReactFlow>
                        {isLogWindowOpen ? (
                            <div className="absolute bottom-4 left-16 z-50 flex w-80 flex-col overflow-hidden border-[3px] border-[#161616] bg-white shadow-[6px_6px_0_#161616]">
                                <div className="flex justify-between items-center border-b-[3px] border-[#161616] bg-[#5de2e7] px-3 py-1.5 text-xs font-black uppercase">
                                    <span className="flex items-center gap-2">
                                        <Terminal size={14} /> Simulation Logs
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
                                <div className="flex h-48 flex-col-reverse overflow-y-auto bg-[#161616] p-2 text-xs font-mono">
                                    {logs.length === 0 ? (
                                        <div className="text-gray-500">
                                            Waiting for events...
                                        </div>
                                    ) : (
                                        [...logs].reverse().map((log) => (
                                            <div
                                                key={log.id}
                                                className="mb-1 flex items-start gap-2 break-words"
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
                        ) : (
                            <div className="absolute bottom-4 left-16 z-50 flex items-center gap-3">
                                <button
                                    onClick={() => setIsLogWindowOpen(true)}
                                    className="neo-button flex h-10 w-10 items-center justify-center bg-[#5de2e7] border-[3px] border-[#161616] shadow-[4px_4px_0_#161616] transition-transform hover:-translate-y-1 hover:translate-x-1 hover:shadow-[0_0_0_#161616]"
                                    title="Open Simulation Logs"
                                    type="button"
                                >
                                    <Terminal size={20} strokeWidth={3} />
                                </button>
                                
                            </div>
                        )}

                        {/* Help Button and Modal */}
                        <div
                            className={`absolute top-4 right-4 z-[10000] ${propertiesNodeId || propertiesEdgeId || infoData ? 'hidden' : ''}`}
                        >
                            <button
                                onClick={() => setIsHelpOpen(!isHelpOpen)}
                                className="neo-button flex h-10 w-10 items-center justify-center bg-[#ffde59] border-[3px] border-[#161616] shadow-[4px_4px_0_#161616] transition-transform hover:-translate-y-1 hover:translate-x-1 hover:shadow-[0_0_0_#161616]"
                                title="Help & Legend"
                            >
                                <HelpCircle size={20} strokeWidth={3} />
                            </button>
                            {isHelpOpen && (
                                <div 
                                    className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                                    onPointerDown={() => setIsHelpOpen(false)}
                                >
                                    <div 
                                        className="neo-panel w-full max-w-2xl bg-white flex flex-col shadow-[12px_12px_0_#161616] max-h-[85vh] animate-in zoom-in-95 duration-200"
                                        onPointerDown={e => e.stopPropagation()}
                                    >
                                        <div className="flex justify-between items-center border-b-[3px] border-[#161616] bg-[#ffde59] px-4 py-3 text-sm font-black uppercase">
                                            <span className="flex items-center gap-2"><HelpCircle size={20} strokeWidth={3} /> Canvas User Guide</span>
                                            <button
                                                onClick={() => setIsHelpOpen(false)}
                                                className="hover:text-[#ff6b6b] transition-colors p-1"
                                            >
                                                <X size={20} strokeWidth={3} />
                                            </button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto overscroll-contain p-6 text-sm font-medium space-y-8 custom-scrollbar">
<div>
                                            <h3 className="mb-2 inline-block border-[2px] border-[#161616] bg-[#ffad66] px-2 py-1 font-black uppercase shadow-[2px_2px_0_#161616]">
                                                Toolbar Reference
                                            </h3>
                                            <ul className="list-disc space-y-1.5 pl-4 text-sm font-bold">
                                                <li>
                                                    <b>Import:</b> load a
                                                    previously exported JSON
                                                    diagram.
                                                </li>
                                                <li>
                                                    <b>JSON:</b> export nodes,
                                                    connections, and diagram
                                                    settings.
                                                </li>
                                                <li>
                                                    <b>PNG:</b> export the
                                                    visible canvas as an image.
                                                </li>
                                                <li>
                                                    <b>Record:</b> capture a
                                                    one-cycle WebM walkthrough
                                                    of the flow.
                                                </li>
                                                <li>
                                                    <b>Run Once:</b> clear the
                                                    current run and execute one
                                                    fresh request.
                                                </li>
                                                <li>
                                                    <b>Play:</b> start or resume
                                                    continuous traffic. It exits
                                                    single-cycle mode.
                                                </li>
                                                <li>
                                                    <b>Pause:</b> freeze the
                                                    simulation clock and keep
                                                    packets in place.
                                                </li>
                                                <li>
                                                    <b>Speed:</b> change
                                                    playback speed without
                                                    changing modeled latency
                                                    values.
                                                </li>
                                                <li>
                                                    <b>RPS:</b> set requests
                                                    generated per second.{' '}
                                                    <b>Max In Flight</b> limits
                                                    active requests; excess
                                                    requests are dropped and
                                                    counted.
                                                </li>
                                                <li>
                                                    <b>Step:</b> from idle,
                                                    prepare a paused run;
                                                    afterward, process exactly
                                                    one queued event per click.
                                                </li>
                                                <li>
                                                    <b>Reset:</b> restore the
                                                    example diagram and clear
                                                    the active simulation.
                                                </li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h3 className="font-black uppercase bg-[#5de2e7] border-[2px] border-[#161616] px-2 py-1 inline-block mb-2 shadow-[2px_2px_0_#161616]">
                                                Building the Canvas
                                            </h3>
                                            <ul className="list-disc pl-4 space-y-1.5 text-sm font-bold">
                                                <li>
                                                    <b>Drag components</b> from
                                                    the left sidebar onto the
                                                    canvas.
                                                </li>
                                                <li>
                                                    <b>Connect nodes</b> by
                                                    dragging a wire from a{' '}
                                                    <b className="text-[#ff4fa3]">
                                                        Pink handle
                                                    </b>{' '}
                                                    (output) to a{' '}
                                                    <b className="text-[#e2b704]">
                                                        Yellow handle
                                                    </b>{' '}
                                                    (input).
                                                </li>
                                                <li>
                                                    <b>Delete items</b> by
                                                    selecting them and pressing{' '}
                                                    <kbd className="border-[2px] border-[#161616] px-1 bg-gray-100 rounded-[2px]">
                                                        Backspace
                                                    </kbd>{' '}
                                                    or clicking their delete
                                                    buttons in properties.
                                                </li>
                                                <li>
                                                    <b>Move around:</b> drag an
                                                    empty area to pan, use the
                                                    mouse wheel to zoom, and use
                                                    the canvas controls to reset
                                                    the view.
                                                </li>
                                                <li>
                                                    <b>Boundaries:</b> drop a
                                                    boundary around components
                                                    to group them by VPC,
                                                    subnet, region, or cluster.
                                                </li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h3 className="font-black uppercase bg-[#a18cff] border-[2px] border-[#161616] px-2 py-1 inline-block mb-2 shadow-[2px_2px_0_#161616]">
                                                Configuring Logic
                                            </h3>
                                            <ul className="list-disc pl-4 space-y-1.5 text-sm font-bold">
                                                <li>
                                                    <b>Nodes:</b>{' '}
                                                    <b>Double-click</b> any node
                                                    to open its Logic panel.
                                                    Here you can write
                                                    instructions on how it
                                                    processes requests, queries
                                                    databases, and handles
                                                    errors.
                                                </li>
                                                <li>
                                                    <b>Wires:</b> <b>Click</b>{' '}
                                                    any wire to open the Wire
                                                    Settings window. You can
                                                    change its label, specify
                                                    the exact protocol (e.g.,
                                                    WebSocket, Kafka), and
                                                    adjust its routing shape.
                                                </li>
                                                <li>
                                                    <b>Routing:</b> logic steps
                                                    run in order. Forward sends
                                                    a request to a selected
                                                    node, Reply returns success,
                                                    and Cache Check creates hit
                                                    or miss behavior.
                                                </li>
                                                <li>
                                                    <b>Connections:</b> invalid
                                                    architecture connections are
                                                    rejected with an
                                                    explanation. Use event names
                                                    and protocols to document
                                                    each wire.
                                                </li>
                                                <li>
                                                    <b>Node popup:</b>{' '}
                                                    double-click a technology
                                                    card to edit processing
                                                    delay, logic steps,
                                                    workload, cache hit rate,
                                                    concurrency, network hops,
                                                    latency multiplier, and
                                                    extra latency. Changes save
                                                    immediately.
                                                </li>
                                                <li>
                                                    <b>Wire popup:</b> click a
                                                    connection to edit its event
                                                    name, protocol/type, and
                                                    shape: curve, step, or
                                                    straight. Click outside or
                                                    use close to dismiss it.
                                                </li>
                                                <li>
                                                    <b>Protocol list:</b> scroll
                                                    inside the list to browse
                                                    synchronous APIs, events,
                                                    streaming, data, network,
                                                    and application protocols.
                                                    Save the wire after choosing
                                                    one.
                                                </li>
                                                <li>
                                                    <b>Save Changes</b> applies
                                                    wire edits. The trash button
                                                    permanently deletes that
                                                    wire. Node logic and latency
                                                    fields update as you edit
                                                    them.
                                                </li>
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
                                                    <b>Architecture Stats:</b> Click the <b>View Stats</b> button in the Right Sidebar (Canvas Tools) to see a live telemetry pop-up counting all components, connections, compute, and databases.
                                                </li>
                                                <li>
                                                    <b>Project Notes:</b> Click <b>Project Notes</b> in the Right Sidebar to open a dedicated workspace scratchpad. Jot down requirements or architectural decisions.
                                                </li>
                                                <li>
                                                    <b>Export Notes:</b> From inside the Project Notes window, you can seamlessly download your notes locally as a <b>.TXT</b> or <b>.JSON</b> file.
                                                </li>
                                                <li>
                                                    <b>Persistent State:</b> Your Project Notes automatically save alongside your canvas state!
                                                </li>
                                                <li>
                                                    <b>Massive Knowledge Base:</b> Every single one of the 275+ technologies and protocols now features highly specific, unique documentation tailored to it.
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
                                                <div className="flex items-center gap-2">
                                                    <span className="w-5 h-4 bg-[#ffde59] border-[2px] border-[#161616] inline-block rounded-[4px]"></span>{' '}
                                                    <b>
                                                        Incoming / Base Request
                                                    </b>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-5 h-4 bg-[#ff4fa3] border-[2px] border-[#161616] inline-block rounded-[4px]"></span>{' '}
                                                    <b>
                                                        Forwarded / Sub-Request
                                                    </b>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-5 h-4 bg-[#9cf57a] border-[2px] border-[#161616] inline-block rounded-[4px]"></span>{' '}
                                                    <b>
                                                        Success Response / Hit
                                                    </b>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-5 h-4 bg-[#ff6b6b] border-[2px] border-[#161616] inline-block rounded-[4px]"></span>{' '}
                                                    <b>Error Response / Miss</b>
                                                </div>
                                                <div className="mt-2 border-t-[2px] border-[#161616] pt-2">
                                                    <div className="mb-1 text-xs font-black uppercase">
                                                        Canvas Marks
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="h-4 w-5 border-[3px] border-[#ff4fa3] bg-white"></span>
                                                        <b>
                                                            Pink outline:
                                                            selected node
                                                        </b>
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <span className="h-4 w-5 border-[2px] border-[#161616] bg-[#ffad66]"></span>
                                                        <b>
                                                            Orange glow: latency
                                                            bottleneck
                                                        </b>
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-2">
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
                        </div>
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
                                    className="neo-button mt-5 flex w-full items-center justify-center gap-2 border-[3px] border-[#161616] bg-[#ff4fa3] px-3 py-2 text-sm font-black uppercase shadow-[3px_3px_0_#161616]"
                                    onClick={() => {
                                        setNodes([]);
                                        setEdges([]);
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
                                    className="neo-button flex w-full items-center justify-center gap-2 border-[3px] border-[#161616] bg-[#ffde59] px-3 py-3 text-sm font-black uppercase shadow-[3px_3px_0_#161616] hover:bg-[#ebd05c]"
                                    type="button"
                                >
                                    <BarChart size={18} strokeWidth={3} /> View Stats
                                </button>
                                <button
                                    onClick={() => setIsNotesOpen(true)}
                                    className="neo-button flex w-full items-center justify-center gap-2 border-[3px] border-[#161616] bg-[#5de2e7] px-3 py-3 text-sm font-black uppercase shadow-[3px_3px_0_#161616] hover:bg-[#48c9ce]"
                                    type="button"
                                >
                                    <FileText size={18} strokeWidth={3} /> Project Notes
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>

                {/* Floating Validation Toasts */}
                <div className="pointer-events-none fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
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
                                <h2 className="font-black uppercase tracking-wider text-lg flex items-center gap-2"><BarChart size={20} strokeWidth={3}/> Architecture Stats</h2>
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
                                <h2 className="font-black uppercase tracking-wider text-lg flex items-center gap-2"><FileText size={20} strokeWidth={3}/> Project Notes</h2>
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
                                <button onClick={downloadNotesTxt} className="neo-button flex items-center gap-2 bg-white border-[3px] border-[#161616] px-4 py-2 text-xs font-black uppercase shadow-[2px_2px_0_#161616] hover:bg-[#ffde59]">
                                    <Download size={16} strokeWidth={3}/> Download .TXT
                                </button>
                                <button onClick={downloadNotesJson} className="neo-button flex items-center gap-2 bg-white border-[3px] border-[#161616] px-4 py-2 text-xs font-black uppercase shadow-[2px_2px_0_#161616] hover:bg-[#a18cff]">
                                    <Download size={16} strokeWidth={3}/> Download .JSON
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





