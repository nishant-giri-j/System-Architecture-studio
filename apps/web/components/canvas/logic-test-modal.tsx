import { useState } from "react";
import { 
    X, 
    ShieldAlert, 
    Download, 
    Loader2, 
    CheckCircle2, 
    AlertTriangle, 
    AlertCircle, 
    Filter,
    Crosshair,
    Trash2
} from "lucide-react";
import type { AiLogicTestResult, LogicAssertion } from "@architecture-studio/shared";
import type { ArchitectureFlowNode } from "./architecture-node";
import type { BoundaryFlowNode } from "./boundary-node";
import type { EventFlowEdge } from "./event-edge";

type AppNode = ArchitectureFlowNode | BoundaryFlowNode;

interface LogicTestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRunTest: () => void;
    onCancel: () => void;
    onDownload: () => void;
    onHighlightNodes: (nodeIds: string[], edgeIds: string[]) => void;
    onClear?: () => void;
    onAutoResolve?: (id: string, issueText: string) => void;
    isResolving?: string | null;
    isTesting: boolean;
    results: AiLogicTestResult | null;
    error: string | null;
    nodes: AppNode[];
    edges: EventFlowEdge[];
}

const severityColors = {
    error: "bg-[#ff6b6b] text-white",
    warn: "bg-[#ffde59] text-gray-900",
    pass: "bg-[#9cf57a] text-gray-900",
};

const severityBorders = {
    error: "border-[#ff6b6b]",
    warn: "border-[#ffde59]",
    pass: "border-[#9cf57a]",
};

// SVG Thumbnail Component
function LogicThumbnail({ 
    nodes, 
    edges, 
    affectedNodeIds, 
    affectedEdgeIds 
}: { 
    nodes: AppNode[]; 
    edges: EventFlowEdge[]; 
    affectedNodeIds: string[]; 
    affectedEdgeIds: string[] 
}) {
    if (affectedNodeIds.length === 0 && affectedEdgeIds.length === 0) return null;

    // Calculate bounding box for affected elements to frame them
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    // Default node size approximation (adjust as needed based on actual node sizing)
    const NODE_WIDTH = 150;
    const NODE_HEIGHT = 50;

    const relevantNodes = nodes.filter(n => affectedNodeIds.includes(n.id) || edges.some(e => affectedEdgeIds.includes(e.id) && (e.source === n.id || e.target === n.id)));
    
    if (relevantNodes.length === 0) return null;

    relevantNodes.forEach(n => {
        if (n.position.x < minX) minX = n.position.x;
        if (n.position.y < minY) minY = n.position.y;
        if (n.position.x + NODE_WIDTH > maxX) maxX = n.position.x + NODE_WIDTH;
        if (n.position.y + NODE_HEIGHT > maxY) maxY = n.position.y + NODE_HEIGHT;
    });

    // Add padding
    const padding = 50;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const viewBox = `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;

    return (
        <div className="w-full h-32 bg-gray-50 border-[3px] border-[#161616] overflow-hidden flex items-center justify-center relative shadow-[inset_4px_4px_0_rgba(0,0,0,0.05)] mb-3">
            <svg viewBox={viewBox} className="w-full h-full p-2">
                {/* Draw relevant edges */}
                {edges.filter(e => affectedEdgeIds.includes(e.id) || (affectedNodeIds.includes(e.source) && affectedNodeIds.includes(e.target))).map(edge => {
                    const sourceNode = nodes.find(n => n.id === edge.source);
                    const targetNode = nodes.find(n => n.id === edge.target);
                    if (!sourceNode || !targetNode) return null;

                    const isHighlighted = affectedEdgeIds.includes(edge.id);

                    // Simplified straight line for thumbnail
                    const x1 = sourceNode.position.x + NODE_WIDTH / 2;
                    const y1 = sourceNode.position.y + NODE_HEIGHT / 2;
                    const x2 = targetNode.position.x + NODE_WIDTH / 2;
                    const y2 = targetNode.position.y + NODE_HEIGHT / 2;

                    return (
                        <line 
                            key={edge.id}
                            x1={x1} y1={y1} x2={x2} y2={y2}
                            stroke={isHighlighted ? "#ff6b6b" : "#cbd5e1"}
                            strokeWidth={isHighlighted ? 4 : 2}
                            strokeDasharray={isHighlighted ? "4 4" : "none"}
                        />
                    );
                })}

                {/* Draw relevant nodes */}
                {relevantNodes.map(node => {
                    const isHighlighted = affectedNodeIds.includes(node.id);
                    return (
                        <g key={node.id} transform={`translate(${node.position.x}, ${node.position.y})`}>
                            <rect 
                                width={NODE_WIDTH} 
                                height={NODE_HEIGHT} 
                                rx={4}
                                fill={node.data.color || "#ffffff"}
                                stroke={isHighlighted ? "#ff6b6b" : "#161616"}
                                strokeWidth={isHighlighted ? 4 : 2}
                            />
                            <text 
                                x={NODE_WIDTH / 2} 
                                y={NODE_HEIGHT / 2 + 5} 
                                textAnchor="middle" 
                                fontSize="12" 
                                fontWeight="bold"
                                fill="#161616"
                                className="uppercase font-sans"
                            >
                                {node.data.label?.substring(0, 15)}{node.data.label?.length > 15 ? '...' : ''}
                            </text>
                        </g>
                    );
                })}
            </svg>
            <div className="absolute top-2 right-2 flex items-center justify-center bg-white border-2 border-[#161616] p-1 text-[10px] font-black uppercase shadow-[2px_2px_0_#161616]">
                Mini-Map
            </div>
        </div>
    );
}

export function LogicTestModal({
    isOpen,
    onClose,
    onRunTest,
    onCancel,
    onDownload,
    onHighlightNodes,
    onClear,
    onAutoResolve,
    isResolving,
    isTesting,
    results,
    error,
    nodes,
    edges
}: LogicTestModalProps) {
    const [sortBy, setSortBy] = useState<"severity" | "category">("severity");

    if (!isOpen) return null;

    const sortedAssertions = results?.assertions ? [...results.assertions].sort((a, b) => {
        if (sortBy === "severity") {
            const order = { error: 0, warn: 1, pass: 2 };
            return order[a.status] - order[b.status];
        } else {
            return a.category.localeCompare(b.category);
        }
    }) : [];

    // Filter out "pass" assertions if they are too numerous, keeping focus on broken things
    const displayAssertions = sortedAssertions.filter(a => a.status !== 'pass' || sortedAssertions.filter(s => s.status !== 'pass').length === 0);

    return (
        <div className="fixed inset-0 z-[10005] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
            <div
                className="flex w-full max-w-4xl max-h-[90vh] flex-col border-[3px] border-[#161616] bg-[#fffdf5] shadow-[12px_12px_0_#161616] animate-in zoom-in-95 duration-200 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b-[3px] border-[#161616] bg-[#5de2e7] p-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <ShieldAlert size={24} strokeWidth={3} />
                        <h2 className="text-xl font-black uppercase tracking-wider">AI Logic & Reliability Tester</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="neo-button p-1.5 hover:bg-white bg-white/50"
                        title="Close"
                    >
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {/* Empty State */}
                    {!results && !isTesting && !error && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <ShieldAlert size={64} strokeWidth={2} className="mb-6 text-gray-300" />
                            <h3 className="text-2xl font-black uppercase">Validate Logic & Architecture</h3>
                            <p className="mt-2 max-w-md text-sm font-bold text-gray-500">
                                Run a deep architectural scan to find infinite loops, routing black holes, protocol mismatches, and chaos fallback issues.
                            </p>
                            <button
                                onClick={onRunTest}
                                className="neo-button mt-8 flex items-center gap-2 bg-[#ff4fa3] px-6 py-3 text-sm font-black uppercase text-white shadow-[4px_4px_0_#161616] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0_#161616] transition-all"
                            >
                                <ShieldAlert size={20} strokeWidth={3} />
                                Run Logic Test
                            </button>
                        </div>
                    )}

                    {error && !isTesting && (
                        <div className="mt-6 border-[3px] border-[#161616] bg-red-100 px-4 py-3 text-sm font-bold text-red-600">
                            Error: {error}
                        </div>
                    )}

                    {/* Analyzing State */}
                    {isTesting && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Loader2 size={48} strokeWidth={3} className="mb-6 animate-spin text-[#ff4fa3]" />
                            <h3 className="text-xl font-black uppercase animate-pulse">Running Logic Tester...</h3>
                            <p className="mt-2 mb-8 text-sm font-bold text-gray-600">Checking data flow, logic constraints, and failure modes.</p>
                            
                            <button
                                onClick={onCancel}
                                className="neo-button flex items-center gap-2 bg-gray-200 px-6 py-3 text-sm font-black uppercase text-gray-800 shadow-[4px_4px_0_#161616] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0_#161616] transition-all"
                            >
                                <X size={16} strokeWidth={3} />
                                Stop Test
                            </button>
                        </div>
                    )}

                    {/* Results State */}
                    {results && !isTesting && (
                        <div className="flex flex-col gap-6">
                            {/* Summary Card */}
                            <div className="flex flex-col md:flex-row gap-4 border-[3px] border-[#161616] bg-white p-4 shadow-[4px_4px_0_#161616]">
                                <div className="flex flex-col items-center justify-center border-r-[3px] border-[#161616] pr-4 md:w-32 shrink-0">
                                    <span className="text-xs font-black uppercase text-gray-500 mb-1">Status</span>
                                    <span className={`text-xl font-black text-center ${results.assertions.some(a => a.status === 'error') ? "text-[#ff6b6b]" : results.assertions.some(a => a.status === 'warn') ? "text-yellow-600" : "text-[#9cf57a]"}`}>
                                        {results.assertions.some(a => a.status === 'error') ? "ERRORS FOUND" : results.assertions.some(a => a.status === 'warn') ? "WARNINGS" : "PASSED"}
                                    </span>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <p className="text-sm font-bold leading-relaxed">{results.summary}</p>
                                </div>
                                <div className="md:ml-auto flex flex-col gap-2 items-center justify-center border-t-[3px] border-[#161616] md:border-t-0 md:border-l-[3px] md:pl-4 pt-4 md:pt-0 shrink-0">
                                    <button
                                        onClick={onRunTest}
                                        className="neo-button flex w-full items-center justify-center gap-2 bg-[#ffde59] px-4 py-2 text-sm font-black uppercase shadow-[2px_2px_0_#161616] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0_#161616]"
                                    >
                                        <ShieldAlert size={16} strokeWidth={3} />
                                        Re-Test
                                    </button>
                                    <button
                                        onClick={onDownload}
                                        className="neo-button flex w-full items-center justify-center gap-2 bg-[#5de2e7] px-4 py-2 text-sm font-black uppercase shadow-[2px_2px_0_#161616] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0_#161616]"
                                    >
                                        <Download size={16} strokeWidth={3} />
                                        Download Report
                                    </button>
                                    {onClear && (
                                        <button
                                            onClick={onClear}
                                            className="neo-button flex w-full items-center justify-center gap-2 bg-[#ff6b6b] text-white px-4 py-2 text-sm font-black uppercase shadow-[2px_2px_0_#161616] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0_#161616]"
                                        >
                                            <Trash2 size={16} strokeWidth={3} />
                                            Clear Results
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-2">
                                <h3 className="font-black uppercase text-lg">Test Assertions</h3>
                                <div className="flex items-center gap-2">
                                    <Filter size={16} />
                                    <span className="text-xs font-bold uppercase mr-2">Sort By:</span>
                                    <div className="flex border-[3px] border-[#161616] bg-white text-xs font-black uppercase">
                                        <button 
                                            className={`px-3 py-1 ${sortBy === 'severity' ? 'bg-[#161616] text-white' : 'hover:bg-gray-100'}`}
                                            onClick={() => setSortBy('severity')}
                                        >
                                            Severity
                                        </button>
                                        <button 
                                            className={`px-3 py-1 border-l-[3px] border-[#161616] ${sortBy === 'category' ? 'bg-[#161616] text-white' : 'hover:bg-gray-100'}`}
                                            onClick={() => setSortBy('category')}
                                        >
                                            Category
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Vulnerabilities List */}
                            <div className="flex flex-col gap-4">
                                {displayAssertions.map((assertion, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex flex-col border-[3px] border-[#161616] bg-white shadow-[6px_6px_0_#161616] transition-all hover:shadow-[4px_4px_0_#161616] hover:translate-x-[2px] hover:translate-y-[2px] cursor-pointer`}
                                        onClick={() => {
                                            onHighlightNodes(assertion.affectedNodeIds, assertion.affectedEdgeIds);
                                        }}
                                    >
                                        <div className={`flex items-center gap-3 border-b-[3px] border-[#161616] px-4 py-2 ${severityBorders[assertion.status]}`}>
                                            <span
                                                className={`flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-black uppercase ${severityColors[assertion.status]}`}
                                            >
                                                {assertion.status === "error" && <AlertCircle size={14} strokeWidth={3} />}
                                                {assertion.status === "warn" && <AlertTriangle size={14} strokeWidth={3} />}
                                                {assertion.status === "pass" && <CheckCircle2 size={14} strokeWidth={3} />}
                                                {assertion.status}
                                            </span>
                                            <span className="text-xs font-bold uppercase text-gray-500 ml-2">
                                                [{assertion.category}]
                                            </span>
                                            <h4 className="font-black text-sm ml-auto flex items-center gap-2">
                                                <Crosshair size={14} /> Click to locate on canvas
                                            </h4>
                                        </div>
                                        <div className="p-4">
                                            <h4 className="font-black text-lg mb-2">{assertion.title}</h4>
                                            
                                            <LogicThumbnail 
                                                nodes={nodes} 
                                                edges={edges} 
                                                affectedNodeIds={assertion.affectedNodeIds} 
                                                affectedEdgeIds={assertion.affectedEdgeIds} 
                                            />

                                            <p className="text-sm font-bold text-gray-700 leading-relaxed mb-4">
                                                {assertion.description}
                                            </p>
                                            
                                            {assertion.remediation && (
                                                <div className="bg-[#fffdf5] border-[2px] border-dashed border-gray-400 p-3">
                                                    <span className="block text-xs font-black uppercase text-gray-500 mb-1">
                                                        Remediation
                                                    </span>
                                                    <p className="text-sm font-bold text-gray-800">
                                                        {assertion.remediation}
                                                    </p>
                                                </div>
                                            )}
                                            {onAutoResolve && assertion.status !== 'pass' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // prevent highlighting nodes when clicking button
                                                        onAutoResolve(assertion.id, `${assertion.title}: ${assertion.description} Fix: ${assertion.remediation}`);
                                                    }}
                                                    disabled={isResolving === assertion.id}
                                                    className="mt-3 neo-button w-full flex items-center justify-center gap-2 bg-[#5de2e7] px-4 py-2 text-sm font-black uppercase shadow-[2px_2px_0_#161616] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0_#161616]"
                                                >
                                                    {isResolving === assertion.id ? (
                                                        <Loader2 size={16} strokeWidth={3} className="animate-spin" />
                                                    ) : (
                                                        "✨ Auto Resolve"
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
