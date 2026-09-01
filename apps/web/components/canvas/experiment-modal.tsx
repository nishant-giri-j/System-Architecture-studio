'use client';

import React, { useState, useEffect, useRef } from 'react';

import { X, Play, Loader2, Beaker, BrainCircuit, Sparkles } from 'lucide-react';

import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

import Markdown from 'react-markdown';

import remarkGfm from 'remark-gfm';

import type { Node } from '@xyflow/react';

import type { ArchitectureNodeData } from './architecture-node';
import { getLayoutedElements } from '../../lib/auto-layout';

export type MutationAction = 'UPDATE_NODE' | 'DELETE_NODE' | 'ADD_NODE' | 'ADD_EDGE' | 'DELETE_EDGE' | 'UPDATE_TRAFFIC';
export type ExperimentMutation = {
    action: MutationAction;
    targetId: string;
    targetField?: string;
    values: any[];
};

export type ExperimentPlan = {
    title: string;
    hypothesis: string;
    stepCount: number;
    mutations: ExperimentMutation[];
    maxInFlight?: number;
    totalLimit?: number;
    playbackSpeed?: number;
    stepDurationMs?: number;
    zoomLevel?: number;
    requestsPerSecond?: number;
    onFitView?: () => void;
};

export type ExperimentResult = {
    stepIndex: number;
    value: any;

    avgLatency: number;

    throughput: number;

    errors: number;

    queueStates: Record<string, number>;

    inTransitStates: Record<string, number>;

    bottlenecks: string[];

};

interface ExperimentModalProps {

    isOpen: boolean;

    onClose: () => void;

    nodes: Node<ArchitectureNodeData>[];

    setNodes: (nodes: Node<ArchitectureNodeData>[]) => void;
    edges: any[];
    setEdges: (edges: any[]) => void;

    metrics: any;

    isPlaying: boolean;

    setIsPlaying: (val: boolean) => void;

    maxInFlight: number;

    setMaxInFlight: (val: number) => void;

    totalLimit: number;

    setTotalLimit: (val: number) => void;

    playbackSpeed: number;

    setPlaybackSpeed: (val: number) => void;

    requestsPerSecond: number;

    setRequestsPerSecond: (val: number) => void;
    setGlobalPayloadSize: (val: number) => void;
    nodeQueues: Record<string, any[]>;

    edgePulses: Record<string, any[]>;

    bottleneckNodes: Set<string>;

    resetSimulationState: () => void;

    onFitView?: () => void;

}

const HistoryCharts = React.memo(({ items, nodes }: { items: any[], nodes: any[] }) => {

    return (
                                <div className="mb-6 flex flex-col gap-12 shrink-0 w-full">
                                    {/* All Historical and Current Charts */}

                                    {items.map((item: any, index: number) => (

                                        <div key={index} className="flex flex-col gap-8 pb-8 border-b-[4px] border-dashed border-[#161616] last:border-b-0">

                                            <div className="bg-[#161616] text-[#9cf57a] p-3 text-sm font-black uppercase self-start shadow-[4px_4px_0_#161616]">

                                                Experiment {index + 1}: {item.plan.title || 'Structural Test'}

                                            </div>

                                            

                                            <div className="h-[24rem] w-full border-[3px] border-[#161616] bg-white p-4 shadow-[4px_4px_0_#161616] flex flex-col">

                                                <h4 className="font-black uppercase text-sm mb-4 text-center text-[#161616]">Throughput & Errors (Packets)</h4>

                                                <div className="flex-1 min-h-0">

                                                    <ResponsiveContainer width="100%" height="100%">

                                                        <ComposedChart data={item.results} margin={{ top: 20, right: 40, bottom: 20, left: 20 }} barGap={6}>

                                                            <CartesianGrid strokeDasharray="3 3" stroke="#161616" opacity={0.2} />

                                                            <XAxis 

                                                                dataKey="stepIndex" 

                                                                height={70}

                                                                stroke="#161616" 

                                                                tick={{ fontWeight: 900, fontSize: 11 }}
                                                                tickFormatter={(val) => {
                                                                    const numVal = Number(val);
                                                                    return `Step ${numVal + 1}`;
                                                                }}

                                                            />

                                                            <YAxis 

                                                                width={60}

                                                                stroke="#161616" 

                                                                tick={{ fontWeight: 900, fontSize: 12 }}

                                                                domain={[0, (dataMax) => Math.max(dataMax, 10)]}

                                                            />

                                                            <RechartsTooltip contentStyle={{ border: '3px solid #161616', borderRadius: 0, boxShadow: '4px 4px 0 #161616', fontWeight: 'bold', backgroundColor: '#fffdf5' }} />

                                                            <Legend wrapperStyle={{ fontWeight: 'black', paddingTop: '10px' }} />

                                                            <Bar dataKey="throughput" fill="#5de2e7" stroke="#161616" strokeWidth={3} maxBarSize={50} name="Successful Throughput" />

                                                            <Bar dataKey="errors" fill="#ff6b6b" stroke="#161616" strokeWidth={3} maxBarSize={50} name="Dropped / Errors" />

                                                        </ComposedChart>

                                                    </ResponsiveContainer>

                                                </div>

                                            </div>

                                            

                                            <div className="h-[24rem] w-full border-[3px] border-[#161616] bg-white p-4 shadow-[4px_4px_0_#161616] flex flex-col">

                                                <h4 className="font-black uppercase text-sm mb-4 text-center text-[#ff4fa3]">Average Latency (ms)</h4>

                                                <div className="flex-1 min-h-0">

                                                    <ResponsiveContainer width="100%" height="100%">

                                                        <ComposedChart data={item.results} margin={{ top: 20, right: 40, bottom: 20, left: 20 }}>

                                                            <CartesianGrid strokeDasharray="3 3" stroke="#161616" opacity={0.2} />

                                                            <XAxis 

                                                                dataKey="stepIndex" 

                                                                height={70}

                                                                stroke="#161616" 

                                                                tick={{ fontWeight: 900, fontSize: 11 }}
                                                                tickFormatter={(val) => {
                                                                    const numVal = Number(val);
                                                                    return `Step ${numVal + 1}`;
                                                                }}

                                                            />

                                                            <YAxis 

                                                                width={60}

                                                                stroke="#ff4fa3" 

                                                                tick={{ fontWeight: 900, fontSize: 12 }}

                                                                domain={[0, (dataMax) => Math.max(dataMax, 10)]}

                                                            />

                                                            <RechartsTooltip contentStyle={{ border: '3px solid #161616', borderRadius: 0, boxShadow: '4px 4px 0 #161616', fontWeight: 'bold', backgroundColor: '#fffdf5' }} />

                                                            <Legend wrapperStyle={{ fontWeight: 'black', paddingTop: '10px' }} />

                                                            <Line type="monotone" dataKey="avgLatency" stroke="#ff4fa3" strokeWidth={5} name="Avg Latency (ms)" dot={{ strokeWidth: 3, r: 6, fill: '#fff', stroke: '#161616' }} activeDot={{ r: 8, fill: '#ff4fa3', stroke: '#161616', strokeWidth: 3 }} />

                                                        </ComposedChart>

                                                    </ResponsiveContainer>

                                                </div>

                                            </div>

                                        </div>

                                    ))}

                                </div>
    );

});

const PromptInput = ({ initialPrompt, onSubmit, disabled }: any) => {
    const [local, setLocal] = useState(initialPrompt);
    
    useEffect(() => {
        setLocal(initialPrompt);
    }, [initialPrompt]);

    return (
        <div className="flex flex-col">
            <textarea
                className="mt-2 w-full resize-none border-[3px] border-[#161616] bg-[#fffdf5] p-3 text-sm font-semibold outline-none focus:bg-[#ffde59] transition-colors"
                rows={5}
                placeholder="e.g., 'What happens if we slowly drop the cache hit rate on the Redis node?' or 'Increase the processing delay on API Gateway by 50ms gaps.'"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                disabled={disabled}
            />
            
            <div className="flex flex-wrap gap-2 mt-4 mb-6">
                {['E-commerce platform with microservices', 'Real-time chat app with WebSocket', 'ML inference pipeline with GPU workers'].map(ex => (
                    <button 
                        key={ex}
                        onClick={() => setLocal(ex)}
                        className="bg-[#161616] text-[#fffdf5] px-3 py-1.5 text-xs font-black uppercase hover:-translate-y-0.5 hover:bg-[#ff4fa3] transition-all shadow-[2px_2px_0_#ffde59]"
                        disabled={disabled}
                    >
                        {ex}
                    </button>
                ))}
            </div>

            <button 
                onClick={() => onSubmit(local)}
                disabled={disabled || !local}
                className="neo-button w-full bg-[#ff4fa3] text-white border-[3px] border-[#161616] py-3 text-sm font-black uppercase tracking-wider shadow-[4px_4px_0_#161616] hover:-translate-y-1 hover:shadow-[6px_6px_0_#161616] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_#161616] flex items-center justify-center gap-2"
            >
                {disabled ? <Loader2 size={18} strokeWidth={3} className="animate-spin" /> : <Play size={18} strokeWidth={3} />}
                Generate & Run
            </button>
        </div>
    );
};

export function ExperimentModal({
    isOpen,
    onClose,
    nodes,
    setNodes,
    edges,
    setEdges,

    metrics,

    isPlaying,

    setIsPlaying,

    maxInFlight,

    setMaxInFlight,

    totalLimit,

    setTotalLimit,

    playbackSpeed,

    setPlaybackSpeed,

    requestsPerSecond,

    setRequestsPerSecond,
    setGlobalPayloadSize,
    nodeQueues,

    edgePulses,

    bottleneckNodes,

    resetSimulationState,

    onFitView

}: ExperimentModalProps) {

    const [prompt, setPrompt] = useState('');

    const [status, setStatus] = useState<'idle' | 'agent-thinking' | 'waiting-for-selection' | 'running' | 'done'>('idle');

    const [history, setHistory] = useState<Array<{ plan: ExperimentPlan, results: ExperimentResult[] }>>([]);

    

    const [plan, setPlan] = useState<ExperimentPlan | null>(null);

    const [proposedPlans, setProposedPlans] = useState<ExperimentPlan[]>([]);

    const [results, setResults] = useState<ExperimentResult[]>([]);

    const [currentStep, setCurrentStep] = useState(0);

    const [conclusion, setConclusion] = useState('');

    const [error, setError] = useState('');

    const [isMinimized, setIsMinimized] = useState(false);

    const originalNodes = useRef<any[]>([]);
    const originalEdges = useRef<any[]>([]);

    const originalLimits = useRef<{ maxInFlight: number, totalLimit: number, playbackSpeed: number, requestsPerSecond: number } | null>(null);
    const hasSnapshotted = useRef(false);

    const runTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);

    const latestMetrics = useRef(metrics);

    const latestNodeQueues = useRef(nodeQueues);

    const latestEdgePulses = useRef(edgePulses);

    const latestBottleneckNodes = useRef(bottleneckNodes);

    useEffect(() => {

        if (status === 'running') {

            setIsMinimized(true);

        } else {

            setIsMinimized(false);

        }

    }, [status]);

    useEffect(() => {

        latestMetrics.current = metrics;

        latestNodeQueues.current = nodeQueues;

        latestEdgePulses.current = edgePulses;

        latestBottleneckNodes.current = bottleneckNodes;

    }, [metrics, nodeQueues, edgePulses, bottleneckNodes]);

    const handleCancel = () => {

        if (abortControllerRef.current) {

            abortControllerRef.current.abort();

            abortControllerRef.current = null;

        }

        setIsPlaying(false);

        setStatus('idle');

        setPlan(null);

        setProposedPlans([]);

        setResults([]);

        setCurrentStep(0);

        if (hasSnapshotted.current) { setNodes(originalNodes.current); setEdges(originalEdges.current); hasSnapshotted.current = false; }

        if (originalLimits.current) {

            setMaxInFlight(originalLimits.current.maxInFlight);

            setTotalLimit(originalLimits.current.totalLimit);

            setPlaybackSpeed(originalLimits.current.playbackSpeed);

            setRequestsPerSecond(originalLimits.current.requestsPerSecond);

            originalLimits.current = null;

        }

    };

    // Stop execution safely when closed if running

    useEffect(() => {

        if (!isOpen) {

            if (status === 'running' || status === 'agent-thinking') {

                handleCancel();

            }

        }

    }, [isOpen, status]);

    const handleClear = () => {

        setStatus('idle');

        setPlan(null);

        setProposedPlans([]);

        setResults([]);

        setConclusion('');

        setPrompt('');

        setHistory([]);

            };

    const handleDownload = () => {

        if (!conclusion || history.length === 0) return;

        

        const historyJson = JSON.stringify(history);

        const conclusionJson = JSON.stringify(conclusion);

        const html = `<!DOCTYPE html>

<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Chaos Engineering Report</title>

    <script src="https://cdn.tailwindcss.com?plugins=typography"></script>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>

    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">

    <style>

        body { font-family: 'Inter', sans-serif; background-color: #fffdf5; color: #161616; }

        .neo-box { border: 4px solid #161616; box-shadow: 8px 8px 0 #161616; background: white; }

        

        /* Perfect PDF Printing Styles */

        @media print {

            body { background-color: white !important; }

            .neo-box { box-shadow: none !important; border: 2px solid #000 !important; page-break-inside: avoid; }

            .no-print { display: none !important; }

            canvas { max-width: 100% !important; height: auto !important; }

        }

    </style>

</head>

<body class="p-8 md:p-12 max-w-5xl mx-auto">

    

    <div class="no-print mb-8 flex justify-end">

        <button onclick="window.print()" class="neo-box px-6 py-3 bg-[#ffde59] font-black uppercase hover:-translate-y-1 transition-transform cursor-pointer">

            Save as PDF

        </button>

    </div>

    <div class="mb-12 neo-box p-8 bg-[#ffde59]" style="background-color: #ffde59;">

        <h1 class="text-4xl font-black uppercase mb-2">Chaos Engineering Report</h1>

        <p class="font-bold text-lg">Generated on ${new Date().toLocaleString()}</p>

    </div>

    <div id="experiments-container" class="space-y-12"></div>

    <div class="mt-16 neo-box p-8 bg-[#9cf57a]" style="background-color: #9cf57a;">

        <h2 class="text-3xl font-black uppercase mb-6">AI Analysis & Conclusion</h2>

        <div id="markdown-container" class="prose max-w-none text-lg leading-relaxed font-medium"></div>

    </div>

    <script>

        // 1. Render Markdown properly

        const conclusionText = ${conclusionJson};

        document.getElementById('markdown-container').innerHTML = marked.parse(conclusionText);

        // 2. Render Charts

        const historyData = ${historyJson};

        const container = document.getElementById('experiments-container');

        historyData.forEach((h, i) => {

            const expDiv = document.createElement('div');

            expDiv.className = 'neo-box p-8';

            expDiv.innerHTML = \`

                <div class="bg-[#161616] text-white p-3 font-black uppercase inline-block mb-6">

                    Experiment \${i + 1}

                </div>

                <h3 class="text-2xl font-black mb-2">\${h.plan.title || 'Structural Test'}</h3>
                <h4 class="text-lg font-bold mb-4 text-neutral-700">\${h.plan.mutations ? h.plan.mutations.map(m => \`[\${m.action}] \${m.targetId} \${m.targetField ? '(' + m.targetField + ')' : ''}\`).join(' | ') : 'Target: ' + h.plan.targetNodeId + ' | Field: ' + h.plan.targetField}</h4>

                <p class="text-lg italic font-semibold mb-8 border-l-4 border-[#161616] pl-4 text-neutral-600">"\${h.plan.hypothesis}"</p>

                

                <div class="grid grid-cols-1 gap-12">

                    <div style="height: 300px; position: relative;">

                        <h4 class="font-black uppercase text-center mb-4">Throughput (req/s) & Errors</h4>

                        <canvas id="chart-throughput-\${i}"></canvas>

                    </div>

                    <div style="height: 300px; position: relative;">

                        <h4 class="font-black uppercase text-center mb-4">Average Latency (ms)</h4>

                        <canvas id="chart-latency-\${i}"></canvas>

                    </div>

                </div>

            \`;

            container.appendChild(expDiv);

            const labels = h.results.map(r => 'Step ' + (r.stepIndex + 1));

            

            // Throughput & Errors Chart

            new Chart(document.getElementById('chart-throughput-' + i), {

                type: 'bar',

                data: {

                    labels: labels,

                    datasets: [

                        { type: 'line', label: 'Throughput (req/s)', data: h.results.map(r => r.throughput), borderColor: '#161616', borderWidth: 3, tension: 0.1 },

                        { type: 'bar', label: 'Errors', data: h.results.map(r => r.errors), backgroundColor: '#ff6b6b', borderColor: '#161616', borderWidth: 2 }

                    ]

                },

                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }

            });

            // Latency Chart

            new Chart(document.getElementById('chart-latency-' + i), {

                type: 'line',

                data: {

                    labels: labels,

                    datasets: [

                        { label: 'Avg Latency (ms)', data: h.results.map(r => r.avgLatency), borderColor: '#ff4fa3', backgroundColor: 'rgba(255, 79, 163, 0.2)', fill: true, borderWidth: 3, tension: 0.3 }

                    ]

                },

                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }

            });

        });

        

        // Auto-trigger print dialog after charts render

        setTimeout(() => {

            window.print();

        }, 1000);

    </script>

</body>

</html>`;

        const blob = new Blob([html], { type: 'text/html' });

        const url = URL.createObjectURL(blob);

        

        // Open in new tab so they can print to PDF

        window.open(url, '_blank');

        

        // Clean up

        setTimeout(() => URL.revokeObjectURL(url), 5000);

    };

    const callChaosAgent = async (currentHistory: any[], forceConclusion: boolean = false) => {

        try {

            const res = await fetch('/api/ai/chaos-agent', {

                method: 'POST',

                headers: { 'Content-Type': 'application/json' },

                body: JSON.stringify({

                    prompt,

                    nodes: nodes.map(n => ({ id: n.id, data: n.data })),

                    history: currentHistory,

                    forceConclusion

                }),

                signal: abortControllerRef.current?.signal

            });

            const data = await res.json();

            if (data.error) throw new Error(data.error);

            const decisionStr = (data.decision || '').toUpperCase();

            if (decisionStr.includes('CONCLUDE') || forceConclusion) {

                setConclusion(data.analysis || 'The AI concluded the experiment.');

                setStatus('done');

            } else if (decisionStr.includes('PROPOSE') && data.plans) {

                setProposedPlans(data.plans);

                setStatus('waiting-for-selection');

            }

        } catch (e: any) {

            if (e.name !== 'AbortError') {

                setError(e.message || "Failed to contact Chaos Agent.");

                setStatus('idle');

            }

        }

    };

    const handleStartChaosAgent = async () => {

        if (!prompt) return;

        if (onFitView) onFitView();

        

        setError('');

        setStatus('agent-thinking');

        setHistory([]);

                

        abortControllerRef.current = new AbortController();

        callChaosAgent([], false);

    };

    // The Automation Engine

    useEffect(() => {

        if (status !== 'running' || !plan) return;

        if (currentStep >= plan.stepCount) {

            setIsPlaying(false);

            

            // Restore Node to Baseline immediately

            if (hasSnapshotted.current) { setNodes(originalNodes.current); setEdges(originalEdges.current); hasSnapshotted.current = false; }

            if (originalLimits.current) {

                setMaxInFlight(originalLimits.current.maxInFlight);

                setTotalLimit(originalLimits.current.totalLimit);

                setPlaybackSpeed(originalLimits.current.playbackSpeed);

                setRequestsPerSecond(originalLimits.current.requestsPerSecond);

            }

            const newHistoryItem = { plan, results };

            const newHistory = [...history, newHistoryItem];

            setHistory(newHistory);

            setResults([]);

            

            setStatus('agent-thinking');

            callChaosAgent(newHistory, false);

            return;

        }

        

        

                // 1. Apply all structural mutations
        let nextNodes = JSON.parse(JSON.stringify(hasSnapshotted.current ? originalNodes.current : nodes));
        let nextEdges = JSON.parse(JSON.stringify(hasSnapshotted.current ? originalEdges.current : edges));
        
        let layoutNeeded = false;
        if (plan.mutations) {
            plan.mutations.forEach((m, mIdx) => {
                if (m.action === 'ADD_NODE' || m.action === 'DELETE_NODE' || m.action === 'ADD_EDGE' || m.action === 'DELETE_EDGE') {
                    layoutNeeded = true;
                }
                const val = m.values[currentStep] ?? m.values[m.values.length - 1];
                if (m.action === 'UPDATE_NODE' && m.targetId && m.targetField) {
                    nextNodes = nextNodes.map((n: any) => {
                        if (n.id === m.targetId) {
                            const newData = JSON.parse(JSON.stringify(n.data));
                            const keys = m.targetField!.split('.');
                            let currentObj = newData;
                            for (let i = 0; i < keys.length - 1; i++) {
                                const k = keys[i] as string;
                                if (!currentObj[k]) currentObj[k] = {};
                                currentObj = currentObj[k];
                            }
                            const lastKey = keys[keys.length - 1] as string;
                            currentObj[lastKey] = val;
                            return { ...n, data: newData };
                        }
                        return n;
                    });
                } else if (m.action === 'DELETE_NODE' && m.targetId) {
                    if (val) {
                        nextNodes = nextNodes.filter((n: any) => n.id !== m.targetId);
                        nextEdges = nextEdges.filter((e: any) => e.source !== m.targetId && e.target !== m.targetId);
                    }
                } else if (m.action === 'DELETE_EDGE' && m.targetId) {
                    if (val) {
                        nextEdges = nextEdges.filter((e: any) => e.id !== m.targetId);
                    }
                } else if (m.action === 'ADD_NODE') {
                    if (val && typeof val === 'object' && val.technologyId && val.label) {
                        // Dynamically create a node
                        const newNodeId = m.targetId || `added-node-${mIdx}`;
                        
                        // Try to position it reasonably (default or relative to connectedTo if passed)
                        let x = 500, y = 500;
                        
                        nextNodes.push({
                            id: newNodeId,
                            type: 'architecture',
                            position: { x, y },
                            data: {
                                label: val.label,
                                technologyId: val.technologyId,
                                color: '#161616',
                                processingDelay: 0,
                                errorRate: 0,
                                latency: {},
                                routingStrategy: 'broadcast',
                                logicSteps: val.logicSteps || [],
                                hardware: val.hardware || undefined,
                                cacheHitRate: val.cacheHitRate || 0
                            }
                        });
                        
                        // Auto-connect if connectedTo was provided
                        if (val.connectedTo) {
                            nextEdges.push({
                                id: m.targetId ? `edge-${m.targetId}` : `added-edge-${mIdx}`,
                                source: val.connectedTo,
                                target: newNodeId,
                                sourceHandle: 'right',
                                targetHandle: 'left',
                                type: 'event',
                                data: { protocol: 'HTTP', rps: 1 }
                            });
                        }
                    }
                } else if (m.action === 'ADD_EDGE') {
                    if (val && typeof val === 'object' && val.source && val.target) {
                        nextEdges.push({
                            id: m.targetId || `added-edge-${mIdx}`,
                            source: val.source,
                            target: val.target,
                            sourceHandle: 'right',
                            targetHandle: 'left',
                            type: 'event',
                            data: { protocol: val.protocol || 'HTTP', rps: 1 }
                        });
                    }
                } else if (m.action === 'UPDATE_TRAFFIC') {
                    if (val && typeof val === 'object' && val.rps) {
                        setRequestsPerSecond(val.rps);
                    }
                    if (val && typeof val === 'object' && val.payloadKb) {
                        setGlobalPayloadSize(val.payloadKb);
                    }
                }
            });
        }

        if (layoutNeeded) {
            const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nextNodes, nextEdges);
            nextNodes = layoutedNodes;
            nextEdges = layoutedEdges;
            if (onFitView) onFitView();
        }

        setNodes(nextNodes);
        setEdges(nextEdges);

        let checkInterval: NodeJS.Timeout;

        let startedAt: number;

        // 2. Wait for React to apply nodes, then hit Play

        const startTimer = setTimeout(() => {

            resetSimulationState();

            setIsPlaying(true);

            startedAt = Date.now();

            

            // 3. Monitor packets dynamically

            const timeoutMs = plan.stepDurationMs || 15000;

            const limit = plan.totalLimit || 1000;

            checkInterval = setInterval(() => {

                const m = latestMetrics.current;

                const q = latestNodeQueues.current;

                const b = latestBottleneckNodes.current;

                const elapsed = Date.now() - startedAt;

                // Wait at least 1000ms before checking to ensure React state has reset and started

                const isFinished = elapsed > 1000 && m.totalRequests >= limit && m.inFlightRequests === 0;

                const isTimeout = elapsed > timeoutMs;

                if (isFinished || isTimeout) {

                    clearInterval(checkInterval);

                    setIsPlaying(false);

                    

                    const queueSizes: Record<string, number> = {};

                    Object.entries(q).forEach(([nodeId, queue]) => {

                        queueSizes[nodeId] = queue.length;

                    });

                    const inTransit: Record<string, number> = {};

                    Object.entries(latestEdgePulses.current).forEach(([edgeId, pulses]) => {

                        inTransit[edgeId] = pulses.length;

                    });

                    setResults(prev => [...prev, {
                        stepIndex: currentStep,
                        value: plan.mutations ? plan.mutations.map(m => {
                            const v = m.values[currentStep] ?? m.values[m.values.length - 1];
                            if (typeof v === 'object') return m.action === 'ADD_NODE' ? `Add ${v.label}` : 'Structural Change';
                            return v;
                        }).join(', ') : 'Step',
                        avgLatency: m.avgLatency || 0,
                        throughput: m.throughputPerSecond || 0,
                        errors: m.totalErrors || 0,

                        queueStates: queueSizes,

                        inTransitStates: inTransit,

                        bottlenecks: Array.from(b)

                    }]);

                    

                    setCurrentStep(c => c + 1);

                }

            }, 250);

        }, 500);

        return () => {

            clearTimeout(startTimer);

            if (checkInterval) clearInterval(checkInterval);

        };

    }, [status, currentStep, plan]);

    if (!isOpen) return null;

    return (

        <div 

            onClick={() => {

                if (!isMinimized && status !== 'running' && status !== 'agent-thinking') {

                    onClose();

                }

            }}

            className={`fixed inset-0 z-[99999] flex p-6 transition-all duration-500 ease-in-out ${

                isMinimized 

                    ? 'items-end justify-start bg-transparent pointer-events-auto' 

                    : 'items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto'

            }`}

        >

            <div 
                onClick={(e) => e.stopPropagation()}
                className={`pointer-events-auto flex flex-col bg-[#fffdf5] border-[4px] border-[#161616] shadow-[8px_8px_0_#161616] transition-all duration-500 overflow-hidden ${
                isMinimized 
                    ? 'w-96 h-auto'
                    : 'w-full max-w-5xl h-full max-h-[85vh]'
            }`}>

                {/* Header */}

                <div className={`flex items-center justify-between border-b-[4px] border-[#161616] bg-[#ffde59] ${isMinimized ? 'p-2 px-3' : 'p-4'}`}>

                    <div className="flex items-center gap-3">

                        <Beaker size={isMinimized ? 20 : 28} strokeWidth={3} className="text-[#161616]" />

                        <h2 className={`${isMinimized ? 'text-sm' : 'text-xl'} font-black uppercase tracking-widest text-[#161616]`}>

                            AI Experiments {isMinimized ? '- Running' : ''}

                        </h2>

                    </div>

                    <div className="flex items-center gap-2">

                        {!isMinimized && status === 'done' && (
                            <>
                                <button
                                    onClick={handleDownload}

                                    className="neo-button border-[3px] border-[#161616] bg-white px-4 py-1.5 font-black uppercase text-xs transition-colors hover:bg-neutral-200"

                                >

                                    Download Report (.pdf)

                                </button>

                                <button

                                    onClick={handleClear}

                                    className="neo-button border-[3px] border-[#161616] bg-white px-4 py-1.5 font-black uppercase text-xs transition-colors hover:bg-neutral-200"

                                >

                                    Clear

                                </button>
                            </>
                        )}

                        {!isMinimized && (

                            <button

                                onClick={() => { handleCancel(); onClose(); }}
                                className="grid h-10 w-10 place-items-center border-[3px] border-[#161616] bg-white transition-colors hover:bg-[#ff6b6b] hover:text-white"

                            >

                                <X size={24} strokeWidth={3} />

                            </button>

                        )}

                        {isMinimized && (

                            <button

                                onClick={handleCancel}

                                className="grid h-7 w-7 place-items-center border-[2px] border-[#161616] bg-white transition-colors hover:bg-[#ff6b6b] hover:text-white"

                                title="Cancel Experiment"

                            >

                                <X size={16} strokeWidth={3} />

                            </button>

                        )}

                    </div>

                </div>

                {isMinimized ? (

                    <div className="p-4 flex flex-col gap-3 bg-white">

                        <div className="flex justify-between items-center text-xs font-black uppercase text-[#161616]">

                            <span>Experiment {history.length + 1} &mdash; Step {currentStep + 1} of {plan?.stepCount || 5}</span>

                            <span className="bg-[#ffde59] px-2 py-0.5 border-[2px] border-[#161616]">Simulating</span>

                        </div>

                        <div className="flex flex-col gap-1">

                            <div className="text-xs font-bold text-[#161616] max-h-24 overflow-y-auto break-words whitespace-pre-wrap pr-2">
                                {plan?.mutations && plan.mutations.map((m, mIdx) => (
                                    <div key={mIdx} className="mb-2">
                                        <span className="text-neutral-500">[{m.action}] {m.targetId} {m.targetField}</span>
                                        <span className="text-[#ff4fa3] ml-2 break-all">Value: {JSON.stringify(m.values[currentStep])}</span>
                                    </div>
                                ))}
                            </div>

                        </div>

                    </div>

                ) : (

                <div className="flex flex-1 overflow-hidden">

                    {/* Sidebar / Prompt */}
                    <div className="w-1/3 border-r-[4px] border-[#161616] bg-white p-6 flex flex-col">
                        <div className="mb-4">
                            <label className="text-sm font-black uppercase text-[#161616]">What do you want to test?</label>
                            <textarea
                                className="mt-2 w-full resize-none border-[3px] border-[#161616] bg-[#fffdf5] p-3 text-sm font-semibold outline-none focus:bg-[#ffde59] transition-colors"
                                rows={5}
                                placeholder="e.g., 'What happens if we slowly drop the cache hit rate on the Redis node?' or 'Increase the processing delay on API Gateway by 50ms gaps.'"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                disabled={status !== 'idle' && status !== 'done'}
                            />
                        </div>
                        
                        <button
                            onClick={handleStartChaosAgent}
                            disabled={status !== 'idle' && status !== 'done'}
                            className="flex w-full items-center justify-center gap-2 border-[3px] border-[#161616] bg-[#9cf57a] px-4 py-3 font-black uppercase transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0_#161616] active:translate-y-0 active:shadow-none disabled:opacity-50"
                        >
                            <Sparkles size={20} strokeWidth={3} />
                            Generate & Run
                        </button>

                        {(status === 'agent-thinking') && (
                            <button
                                onClick={handleCancel}
                                className="mt-2 flex w-full items-center justify-center gap-2 border-[3px] border-[#161616] bg-[#ff6b6b] px-4 py-3 font-black uppercase text-white transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0_#161616] active:translate-y-0 active:shadow-none"
                            >
                                <X size={20} strokeWidth={3} />
                                Cancel
                            </button>
                        )}

                        {error && (
                            <div className="mt-4 border-[3px] border-[#161616] bg-[#ff6b6b] p-3 text-xs font-bold text-white">
                                Error: {error}
                            </div>
                        )}



                        {(history.length > 0 || (plan && status === 'running')) && (
                            <div className="mt-6 flex-1 overflow-y-auto border-[3px] border-[#161616] bg-[#fffdf5] p-4 flex flex-col gap-6">
                                <h3 className="text-xs font-black uppercase">Test Plan History</h3>
                                {[...history.map(h => h.plan), ...(plan && status === 'running' ? [plan] : [])].map((p, idx) => (
                                    <div key={idx} className="space-y-3 pb-6 border-b-[2px] border-dashed border-neutral-300 last:border-b-0 last:pb-0">
                                        <div className="text-xs font-black uppercase text-[#161616]">Experiment {idx + 1}</div>
                                        <div className="bg-[#161616] text-[#ffde59] p-2 text-[10px] font-bold font-mono">
                                            {p.mutations && p.mutations.map((m, mIdx) => (
                                                <div key={mIdx} className="mb-1 last:mb-0">
                                                    [{m.action}] {m.targetId} {m.targetField ? `(${m.targetField})` : ''}
                                                    <div className="text-[#5de2e7] ml-2">VALUES: {m.values.join(' \u2192 ')}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="text-xs font-semibold italic text-neutral-600 border-l-[3px] border-[#161616] pl-2 mt-4">
                                            "{p.hypothesis}"
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Main Content (Charts / Report) */}
                    <div className="flex-1 flex flex-col p-6 bg-[#fffdf5] overflow-y-auto relative">
                        {status === 'agent-thinking' && (
                            <div className="border-[3px] border-[#161616] p-8 shadow-[4px_4px_0_#161616] bg-[#ffde59] flex flex-col items-center justify-center mb-6 animate-pulse">
                                <Loader2 size={48} className="text-[#161616] animate-spin mb-4" strokeWidth={3} />
                                <h3 className="font-black text-2xl uppercase text-[#161616] text-center">AI is analyzing results...</h3>
                                <p className="font-bold text-[#161616] text-center mt-2">Generating your next set of experiment options.</p>
                            </div>
                        )}
                        {status === 'waiting-for-selection' && (
                            <div className="border-[3px] border-[#161616] p-6 shadow-[4px_4px_0_#161616] bg-white flex flex-col mb-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles size={24} className="text-[#ff4fa3]" strokeWidth={3} />
                                    <h3 className="font-black text-xl uppercase text-[#161616]">Select Next Experiment</h3>
                                </div>
                                {conclusion && (
                                    <div className="mb-6 p-4 border-[3px] border-[#161616] bg-[#5de2e7] text-black">
                                        <h4 className="font-black uppercase text-sm mb-2">AI Analysis of Latest Results:</h4>
                                        <div className="text-black font-medium leading-relaxed [&_h1]:text-2xl [&_h1]:font-black [&_h1]:mb-4 [&_h1]:uppercase [&_h2]:text-xl [&_h2]:font-black [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:uppercase [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4 [&_li]:mb-1 [&_strong]:font-black [&_strong]:bg-[#ffde59] [&_strong]:px-1">
                                            <Markdown>{conclusion}</Markdown>
                                        </div>
                                    </div>
                                )}
                                <p className="font-bold text-sm mb-6 text-[#161616]">
                                    The AI has analyzed the results and proposes the following distinct tests. Choose one to execute:
                                </p>
                                <div className="grid grid-cols-1 gap-4 mb-6">
                                    {proposedPlans.map((p, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => {
                                                setPlan(p);
                                                setResults([]);
                                                setCurrentStep(0);
                                                
                                                originalNodes.current = JSON.parse(JSON.stringify(nodes));
                                                hasSnapshotted.current = true;
                                                originalEdges.current = JSON.parse(JSON.stringify(edges));
                                                originalLimits.current = { maxInFlight, totalLimit, playbackSpeed, requestsPerSecond };
                                                
                                                if (p.playbackSpeed) setPlaybackSpeed(p.playbackSpeed);
                                                if (p.requestsPerSecond) setRequestsPerSecond(p.requestsPerSecond);
                                                if (onFitView) onFitView();
                                                
                                                setStatus('running');
                                                setIsPlaying(true);
                                            }}
                                            className="border-[3px] border-[#161616] bg-[#fffdf5] p-4 cursor-pointer hover:bg-[#ffde59] hover:-translate-y-1 hover:shadow-[4px_4px_0_#161616] transition-all flex flex-col gap-2"
                                        >
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-black uppercase text-[#161616]">{p.title || `Option ${idx + 1}`}</h4>
                                                <span className="bg-[#161616] text-white px-2 py-1 text-xs font-black uppercase">Option {idx + 1}</span>
                                            </div>
                                            <div className="flex flex-col gap-1 mt-1 mb-2">
                                                {p.mutations && p.mutations.map((m, mIdx) => (
                                                    <div key={mIdx} className="text-xs font-bold text-neutral-600">
                                                        [{m.action}] {m.targetId} {m.targetField ? `(${m.targetField})` : ''}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="text-sm font-semibold italic text-neutral-800">"{p.hypothesis}"</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-end pt-4 border-t-[3px] border-[#161616]">
                                    <button 
                                        onClick={() => {
                                            setStatus('agent-thinking');
                                            callChaosAgent(history, true);
                                        }}
                                        className="neo-button bg-[#ff6b6b] text-white hover:bg-[#e05656] font-black uppercase text-sm px-6 py-2"
                                    >
                                        Conclude & Generate Report
                                    </button>
                                </div>
                            </div>
                        )}
                        {/* All Historical and Current Charts */}
                        <div className="mb-6 flex flex-col gap-12 shrink-0 w-full">

                                    {[...history, ...(status === 'running' && results.length > 0 ? [{ plan: plan!, results }] : [])].map((item, index) => (

                                        <div key={index} className="flex flex-col gap-8 pb-8 border-b-[4px] border-dashed border-[#161616] last:border-b-0">

                                            <div className="bg-[#161616] text-[#9cf57a] p-3 text-sm font-black uppercase self-start shadow-[4px_4px_0_#161616]">

                                                Experiment {index + 1}: {item.plan.title || 'Structural Test'}

                                            </div>

                                            

                                            <div className="h-[24rem] w-full border-[3px] border-[#161616] bg-white p-4 shadow-[4px_4px_0_#161616] flex flex-col">

                                                <h4 className="font-black uppercase text-sm mb-4 text-center text-[#161616]">Throughput & Errors (Packets)</h4>

                                                <div className="flex-1 min-h-0">

                                                    <ResponsiveContainer width="100%" height="100%">

                                                        <ComposedChart data={item.results} margin={{ top: 20, right: 40, bottom: 20, left: 20 }} barGap={6}>

                                                            <CartesianGrid strokeDasharray="3 3" stroke="#161616" opacity={0.2} />

                                                            <XAxis 

                                                                dataKey="stepIndex" 

                                                                height={70}

                                                                stroke="#161616" 

                                                                tick={{ fontWeight: 900, fontSize: 11 }}
                                                                tickFormatter={(val) => {
                                                                    const numVal = Number(val);
                                                                    return `Step ${numVal + 1}`;
                                                                }}

                                                            />

                                                            <YAxis 

                                                                width={60}

                                                                stroke="#161616" 

                                                                tick={{ fontWeight: 900, fontSize: 12 }}

                                                                domain={[0, (dataMax) => Math.max(dataMax, 10)]}

                                                            />

                                                            <RechartsTooltip contentStyle={{ border: '3px solid #161616', borderRadius: 0, boxShadow: '4px 4px 0 #161616', fontWeight: 'bold', backgroundColor: '#fffdf5' }} />

                                                            <Legend wrapperStyle={{ fontWeight: 'black', paddingTop: '10px' }} />

                                                            <Bar dataKey="throughput" fill="#5de2e7" stroke="#161616" strokeWidth={3} maxBarSize={50} name="Successful Throughput" />

                                                            <Bar dataKey="errors" fill="#ff6b6b" stroke="#161616" strokeWidth={3} maxBarSize={50} name="Dropped / Errors" />

                                                        </ComposedChart>

                                                    </ResponsiveContainer>

                                                </div>

                                            </div>

                                            

                                            <div className="h-[24rem] w-full border-[3px] border-[#161616] bg-white p-4 shadow-[4px_4px_0_#161616] flex flex-col">

                                                <h4 className="font-black uppercase text-sm mb-4 text-center text-[#ff4fa3]">Average Latency (ms)</h4>

                                                <div className="flex-1 min-h-0">

                                                    <ResponsiveContainer width="100%" height="100%">

                                                        <ComposedChart data={item.results} margin={{ top: 20, right: 40, bottom: 20, left: 20 }}>

                                                            <CartesianGrid strokeDasharray="3 3" stroke="#161616" opacity={0.2} />

                                                            <XAxis 

                                                                dataKey="stepIndex" 

                                                                height={70}

                                                                stroke="#161616" 

                                                                tick={{ fontWeight: 900, fontSize: 11 }}
                                                                tickFormatter={(val) => {
                                                                    const numVal = Number(val);
                                                                    return `Step ${numVal + 1}`;
                                                                }}

                                                            />

                                                            <YAxis 

                                                                width={60}

                                                                stroke="#ff4fa3" 

                                                                tick={{ fontWeight: 900, fontSize: 12 }}

                                                                domain={[0, (dataMax) => Math.max(dataMax, 10)]}

                                                            />

                                                            <RechartsTooltip contentStyle={{ border: '3px solid #161616', borderRadius: 0, boxShadow: '4px 4px 0 #161616', fontWeight: 'bold', backgroundColor: '#fffdf5' }} />

                                                            <Legend wrapperStyle={{ fontWeight: 'black', paddingTop: '10px' }} />

                                                            <Line type="monotone" dataKey="avgLatency" stroke="#ff4fa3" strokeWidth={5} name="Avg Latency (ms)" dot={{ strokeWidth: 3, r: 6, fill: '#fff', stroke: '#161616' }} activeDot={{ r: 8, fill: '#ff4fa3', stroke: '#161616', strokeWidth: 3 }} />

                                                        </ComposedChart>

                                                    </ResponsiveContainer>

                                                </div>

                                            </div>

                                        </div>

                                    ))}

                                    

                                    {history.length === 0 && results.length === 0 && (

                                        <div className="h-64 w-full border-[3px] border-[#161616] bg-white p-4 shadow-[4px_4px_0_#161616] flex items-center justify-center">

                                            <span className="text-sm font-black text-neutral-400 uppercase">Waiting for data...</span>

                                        </div>

                                    )}

                                </div>

                                {/* Conclusion */}

                                {status === 'done' && conclusion && (

                                    <div className="prose prose-sm max-w-none border-[3px] border-[#161616] bg-white p-6 shadow-[4px_4px_0_#161616]">

                                        <div className="mb-4 flex items-center gap-2 border-b-[3px] border-[#161616] pb-2">

                                            <BrainCircuit size={24} className="text-[#5de2e7]" strokeWidth={3} />

                                            <h3 className="m-0 text-lg font-black uppercase tracking-wider text-[#161616]">

                                                AI Analysis Report

                                            </h3>

                                        </div>

                                        <div className="text-black font-medium leading-relaxed [&_h1]:text-2xl [&_h1]:font-black [&_h1]:mb-4 [&_h1]:uppercase [&_h2]:text-xl [&_h2]:font-black [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:uppercase [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4 [&_li]:mb-1 [&_strong]:font-black [&_strong]:bg-[#ffde59] [&_strong]:px-1 text-lg">

                                            <Markdown

                                                remarkPlugins={[remarkGfm]}

                                                components={{

                                                    pre({ children }: any) {

                                                        return (

                                                            <div className="bg-[#161616] text-[#9cf57a] p-4 rounded-none border-[3px] border-[#161616] shadow-[4px_4px_0_#161616] overflow-x-auto my-6 font-mono text-xs whitespace-pre [&>code]:!bg-transparent [&>code]:!border-0 [&>code]:!p-0">

                                                                {children}

                                                            </div>

                                                        )

                                                    },

                                                    code({ node, className, children, ...props }: any) {

                                                        return (

                                                            <code className="bg-[#ffde59] text-black px-1.5 py-0.5 border-2 border-[#161616] font-bold mx-0.5 whitespace-nowrap" {...props}>

                                                                {children}

                                                            </code>

                                                        )

                                                    },

                                                    blockquote({children}) {

                                                        return (

                                                            <blockquote className="border-l-[4px] border-[#ffde59] bg-[#fff9db] p-4 my-4 font-bold italic shadow-[4px_4px_0_#161616]">

                                                                {children}

                                                            </blockquote>

                                                        )

                                                    },

                                                    table({ children }) {

                                                        return (

                                                            <div className="overflow-x-auto my-6 border-[3px] border-[#161616] shadow-[4px_4px_0_#161616]">

                                                                <table className="w-full text-left border-collapse bg-white">

                                                                    {children}

                                                                </table>

                                                            </div>

                                                        )

                                                    },

                                                    th({children}) {

                                                        return <th className="border-b-[3px] border-r-[3px] border-[#161616] bg-[#5de2e7] px-4 py-2 font-black uppercase text-xs">{children}</th>

                                                    },

                                                    td({children}) {

                                                        return <td className="border-b-[3px] border-r-[3px] border-[#161616] bg-white px-4 py-2 font-bold text-sm">{children}</td>

                                                    }

                                                }}

                                            >

                                                {conclusion}
                                            </Markdown>
                                        </div>
                                    </div>
                                )}
                    </div>
                </div>
                )}
            </div>
        </div>
    );
}

