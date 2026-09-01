import type {
    LatencyWorkload,
    LogicCondition,
    LogicStep,
    NodeLatencyConfig,
    TechnologyDefinition,
} from '@architecture-studio/shared';
import { Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ArchitectureFlowNode } from './architecture-node';
import type { EventFlowEdge } from './event-edge';

interface NodePropertiesProps {
    nodeId?: string;
    nodes: ArchitectureFlowNode[];
    edges: EventFlowEdge[];
    technologies: TechnologyDefinition[];
    onUpdateNode: (
        nodeId: string,
        dataUpdates: any
    ) => void;
    onClose: () => void;
    onDeleteNode?: (nodeId: string) => void;
}

export function NodePropertiesPanel({
    onDeleteNode,
    nodeId,
    nodes,
    edges,
    technologies,
    onUpdateNode,
    onClose,
}: NodePropertiesProps) {
    const node = nodes.find((n) => n.id === nodeId);

    const [action, setAction] = useState<LogicStep['action']>('forward');
    const [targetId, setTargetId] = useState<string>('');
    const [condition, setCondition] = useState<LogicCondition>('always');
    const [hitRate, setHitRate] = useState<number>(80);
    const [editingStepId, setEditingStepId] = useState<string | null>(null);

    const [draftSteps, setDraftSteps] = useState<LogicStep[]>([]);
    const [draftDelay, setDraftDelay] = useState<number>(0);
    const [draftLatency, setDraftLatency] = useState<NodeLatencyConfig>({});
    const [draftStrategy, setDraftStrategy] = useState<'broadcast' | 'load-balance'>('broadcast');
    const [draftDisabled, setDraftDisabled] = useState<boolean>(false);
    const [draftErrorRate, setDraftErrorRate] = useState<number>(0);
    const [draftCpu, setDraftCpu] = useState<number>(4);
    const [draftMemory, setDraftMemory] = useState<number>(1024);
    const [draftBandwidth, setDraftBandwidth] = useState<number>(1000);

    useEffect(() => {
        if (node) {
            setDraftSteps(node.data.logicSteps || []);
            setDraftDelay(node.data.processingDelay || 0);
            setDraftLatency(node.data.latency || {});
            setDraftStrategy(node.data.routingStrategy || 'broadcast');
            setDraftDisabled(node.data.disabled || false);
            setDraftErrorRate(node.data.errorRate || 0);
            setDraftCpu(node.data.hardware?.cpuCores || 4);
            setDraftMemory(node.data.hardware?.memoryMb || 1024);
            setDraftBandwidth(node.data.bandwidthCapacity || 1000);
        }
    }, [nodeId, node?.data]);

    // Get nodes connected via any edges from the current node
    const connectedTargets = useMemo(() => {
        if (!node) return [];
        const targets = edges
            .filter((e) => e.source === node.id || e.target === node.id)
            .map((e) => {
                const targetId = e.source === node.id ? e.target : e.source;
                const targetNode = nodes.find((n) => n.id === targetId);
                return { edgeId: e.id, targetNode };
            })
            .filter((t) => t.targetNode !== undefined) as {
            edgeId: string;
            targetNode: ArchitectureFlowNode;
        }[];
        
        // Deduplicate by targetNode.id so a node only appears once in the dropdown
        const uniqueTargets = new Map();
        targets.forEach(t => {
            if (!uniqueTargets.has(t.targetNode.id)) {
                uniqueTargets.set(t.targetNode.id, t);
            }
        });
        return Array.from(uniqueTargets.values());
    }, [node, edges, nodes]);

    useEffect(() => {
        if (connectedTargets.length > 0 && !targetId) {
            const firstTarget = connectedTargets[0]?.targetNode;
            if (firstTarget) setTargetId(firstTarget.id);
        }
    }, [connectedTargets, targetId]);

    if (!node) return null;

    const steps = draftSteps;
    const latency = draftLatency;

    const updateLatency = (
        field: keyof NodeLatencyConfig,
        value: string | number,
    ) => {
        setDraftLatency(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveStep = () => {
        if (editingStepId) {
            const updatedSteps = steps.map((s) =>
                s.id === editingStepId
                    ? {
                          ...s,
                          action,
                          condition,
                          targetNodeId:
                              action === 'forward' ? targetId : undefined,
                          hitRate:
                              action === 'simulate-cache' ? hitRate : undefined,
                      }
                    : s,
            );
            setDraftSteps(updatedSteps);
            setEditingStepId(null);
        } else {
            const newStep: LogicStep = {
                id: crypto.randomUUID(),
                action,
                condition,
                targetNodeId: action === 'forward' ? targetId : undefined,
                hitRate: action === 'simulate-cache' ? hitRate : undefined,
            };
            setDraftSteps([...steps, newStep]);
        }
    };

    const handleEditStep = (step: LogicStep) => {
        setEditingStepId(step.id);
        setAction(step.action);
        setCondition(step.condition);
        if (step.targetNodeId) setTargetId(step.targetNodeId);
        if (step.hitRate !== undefined) setHitRate(step.hitRate);
    };

    const handleDeleteStep = (stepId: string) => {
        setDraftSteps(steps.filter(s => s.id !== stepId));
        if (editingStepId === stepId) setEditingStepId(null);
    };

    const handleCancelEdit = () => {
        setEditingStepId(null);
    };

    const renderForm = (isEditing: boolean) => (
        <div className="flex flex-col gap-3 text-sm font-bold w-full">
            <label className="flex flex-col gap-1">
                Action
                <select
                    className="p-1 border-[2px] border-[#161616] bg-white focus:bg-[#d8fbfe] focus:outline-none transition-colors w-full font-bold"
                    value={action}
                    onChange={(e) => setAction(e.target.value as any)}
                >
                    <option value="forward">Forward Request</option>
                    <option value="reply">Send Reply</option>
                    <option value="simulate-cache">Simulate Cache Check</option>
                </select>
            </label>

            {action === 'forward' && (
                <label className="flex flex-col gap-1">
                    Target Node
                    <select
                        className="p-1 border-[2px] border-[#161616] bg-white focus:bg-[#d8fbfe] focus:outline-none transition-colors w-full font-bold"
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                    >
                        {connectedTargets.length === 0 && (
                            <option value="" disabled>
                                No connections
                            </option>
                        )}
                        {connectedTargets.map((t) => (
                            <option
                                key={t.targetNode.id}
                                value={t.targetNode.id}
                            >
                                {t.targetNode.data.label}
                            </option>
                        ))}
                    </select>
                </label>
            )}

            {action === 'simulate-cache' && (
                <label className="flex flex-col gap-1">
                    Hit Rate (%)
                    <input
                        type="number"
                        min="0"
                        max="100"
                        className="p-1 border-[2px] border-[#161616] bg-white focus:bg-[#d8fbfe] focus:outline-none transition-colors w-full font-bold"
                        value={hitRate}
                        onChange={(e) => setHitRate(Number(e.target.value))}
                    />
                </label>
            )}

            <label className="flex flex-col gap-1">
                Condition
                <select
                    className="p-1 border-[2px] border-[#161616] bg-white focus:bg-[#d8fbfe] focus:outline-none transition-colors w-full font-bold"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as any)}
                >
                    <option value="always">Always</option>
                    <option value="on-hit">On Cache Hit</option>
                    <option value="on-miss">On Cache Miss</option>
                    <option value="on-success">On Success</option>
                    <option value="on-error">On Error</option>
                </select>
            </label>

            <div className="mt-3 flex gap-2">
                <button
                    className={`neo-button flex-1 flex items-center justify-center gap-2 p-2 uppercase ${isEditing ? 'bg-[#5de2e7]' : 'bg-[#9cf57a]'}`}
                    onClick={handleSaveStep}
                    disabled={action === 'forward' && !targetId}
                >
                    {isEditing ? (
                        <>
                            <Save size={16} strokeWidth={3} /> Update Step
                        </>
                    ) : (
                        <>
                            <Plus size={16} strokeWidth={3} /> Add Step
                        </>
                    )}
                </button>
                {isEditing && (
                    <button
                        className="neo-button flex items-center justify-center gap-2 bg-[#ff6b6b] p-2 uppercase"
                        onClick={handleCancelEdit}
                        title="Cancel Edit"
                    >
                        <X size={16} strokeWidth={3} />
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onPointerDown={() => onClose()}>
            <div className="neo-panel w-full max-w-md bg-white flex flex-col shadow-[12px_12px_0_#161616] max-h-[85vh]" onPointerDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b-[3px] border-[#161616] bg-[#5de2e7] p-3">
                <h3 className="font-black uppercase truncate pr-2">
                    {node.data.label} {technologies.find(t => t.id === node.data.technologyId)?.category === 'client' ? 'Settings' : 'Logic'}
                </h3>
                <button onClick={onClose} className="hover:bg-black/10 p-1 transition-colors border-[2px] border-transparent hover:border-[#161616]"><X size={20} strokeWidth={3} /></button></div><div className="flex-1 overflow-y-auto p-4 bg-[#f8f9fa] custom-scrollbar">
                {technologies.find(t => t.id === node.data.technologyId)?.category === 'client' && (
                    <div className="mb-6 border-[3px] border-[#161616] p-3 shadow-[4px_4px_0_#161616] bg-[#ffde59]">
                        <label className="flex items-center gap-3 text-sm font-black uppercase cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-5 h-5 accent-[#ff4fa3]"
                                checked={!draftDisabled}
                                onChange={(e) => {
                                    setDraftDisabled(!e.target.checked);
                                }}
                            />
                            <span>Enable Traffic Generation</span>
                        </label>
                        <p className="text-[10px] font-bold mt-2 text-[#161616]/70 normal-case leading-tight">
                            Uncheck to pause requests from this specific client during the simulation. Useful for isolating traffic sources.
                        </p>
                    </div>
                )}
                <div className="mb-6 border-[3px] border-[#161616] p-3 shadow-[4px_4px_0_#161616] bg-white">
                    <label className="flex flex-col gap-1 text-sm font-black uppercase">
                        Simulated Processing Delay
                        <div className="flex items-center gap-2 mt-2">
                            <input
                                type="range"
                                min="0"
                                max="5000"
                                step="10"
                                value={draftDelay}
                                onChange={(e) =>
                                    setDraftDelay(parseInt(e.target.value) || 0)
                                }
                                className="w-full accent-[#ff4fa3]"
                            />
                            <div className="flex items-center gap-1">
                                <input
                                    type="number"
                                    min="0"
                                    max="5000"
                                    value={draftDelay}
                                    onChange={(e) => setDraftDelay(parseInt(e.target.value) || 0)}
                                    className="w-16 text-right font-mono font-black text-sm bg-white border-[2px] border-[#161616] px-1 py-0.5 text-[#ff4fa3] focus:bg-[#d8fbfe] transition-colors focus:outline-none"
                                />
                                <span className="text-xs font-black text-[#ff4fa3]">ms</span>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-[#161616]/70 leading-tight mt-1 normal-case">
                            Make this node slower to observe latency
                            bottlenecks.
                        </span>
                    </label>
                </div>

                
                <div className="mb-6 border-[3px] border-[#161616] p-3 shadow-[4px_4px_0_#161616] bg-white">
                    <label className="flex flex-col gap-1 text-sm font-black uppercase">
                        Simulated Error / Drop Rate
                        <div className="flex items-center gap-2 mt-2">
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={draftErrorRate}
                                onChange={(e) => setDraftErrorRate(parseFloat(e.target.value) || 0)}
                                className="w-full accent-[#ff6b6b]"
                            />
                            <div className="flex items-center gap-1">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={Math.round(draftErrorRate * 100)}
                                    onChange={(e) => setDraftErrorRate((parseFloat(e.target.value) || 0) / 100)}
                                    className="w-16 text-right font-mono font-black text-sm bg-white border-[2px] border-[#161616] px-1 py-0.5 text-[#ff6b6b] focus:bg-[#d8fbfe] transition-colors focus:outline-none"
                                />
                                <span className="text-xs font-black text-[#ff6b6b]">%</span>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-[#161616]/70 leading-tight mt-1 normal-case">
                            Simulate packet loss or a node crash. At 100%, all incoming packets are instantly destroyed.
                        </span>
                    </label>
                </div>

                <div className="mb-6 border-[3px] border-[#161616] p-3 shadow-[4px_4px_0_#161616] bg-white">
                    <label className="flex flex-col gap-1 text-sm font-black uppercase">
                        Routing Strategy
                        <select
                            className="p-1 border-[2px] border-[#161616] bg-white focus:bg-[#d8fbfe] focus:outline-none transition-colors w-full mt-2 font-bold"
                            value={draftStrategy}
                            onChange={(e) => {
                                const newStrategy = e.target.value as 'broadcast' | 'load-balance';
                                setDraftStrategy(newStrategy);
                            }}
                        >
                            <option value="broadcast">Broadcast (Default)</option>
                            <option value="load-balance">Load Balance</option>
                        </select>
                        <span className="text-[10px] font-bold text-[#161616]/70 leading-tight mt-1 normal-case">
                            'Broadcast' copies traffic to all outputs. 'Load Balance' picks one output randomly.
                        </span>
                    </label>
                </div>
                <div className="mb-6 border-[3px] border-[#161616] p-3 shadow-[4px_4px_0_#161616] bg-white">
                    <h4 className="mb-3 border-b-[3px] border-[#161616] pb-1 text-sm font-black uppercase">
                        Realistic Latency Model
                    </h4>
                    <div className="flex flex-col gap-3 text-sm font-bold">
                        <div className="text-[10px] font-black uppercase text-[#161616]/60">
                            Technology profile:{' '}
                            {technologies.find(
                                (technology) =>
                                    technology.id === node.data.technologyId,
                            )?.label || node.data.technologyId}
                        </div>
                        <label className="flex flex-col gap-1">
                            Workload
                            <select
                                className="p-1 border-[2px] border-[#161616] bg-white focus:bg-[#d8fbfe] focus:outline-none transition-colors w-full font-bold"
                                value={latency.workload || 'normal'}
                                onChange={(event) =>
                                    updateLatency(
                                        'workload',
                                        event.target.value as LatencyWorkload,
                                    )
                                }
                            >
                                <option value="light">Light</option>
                                <option value="normal">Normal</option>
                                <option value="heavy">Heavy</option>
                            </select>
                        </label>
                        { (technologies.find(t => t.id === node.data.technologyId)?.category === 'cache' || steps.some(s => s.action === 'simulate-cache')) && (
                            <label className="flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                    <span>Cache hit rate</span>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={latency.cacheHitRate ?? 80}
                                            onChange={(event) =>
                                                updateLatency(
                                                    'cacheHitRate',
                                                    Number(event.target.value) || 0,
                                                )
                                            }
                                            className="w-16 text-right font-mono font-black text-sm bg-white border-[2px] border-[#161616] px-1 py-0.5 text-[#9cf57a] focus:bg-[#d8fbfe] transition-colors focus:outline-none"
                                        />
                                        <span className="text-xs font-black text-[#9cf57a]">%</span>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={latency.cacheHitRate ?? 80}
                                    onChange={(event) =>
                                        updateLatency(
                                            'cacheHitRate',
                                            Number(event.target.value),
                                        )
                                    }
                                    className="w-full accent-[#9cf57a]"
                                />
                            </label>
                        )}
                        <label className="flex flex-col gap-1">
                            Concurrent requests
                            <input
                                type="number"
                                min="1"
                                max="1000"
                                className="p-1 border-[2px] border-[#161616] bg-white focus:bg-[#d8fbfe] focus:outline-none transition-colors w-full font-bold"
                                value={latency.concurrency ?? 1}
                                onChange={(event) =>
                                    updateLatency(
                                        'concurrency',
                                        Math.max(1, Number(event.target.value)),
                                    )
                                }
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            Network hops
                            <input
                                type="number"
                                min="0"
                                max="20"
                                className="p-1 border-[2px] border-[#161616] bg-white focus:bg-[#d8fbfe] focus:outline-none transition-colors w-full font-bold"
                                value={latency.networkHops ?? 1}
                                onChange={(event) =>
                                    updateLatency(
                                        'networkHops',
                                        Math.max(0, Number(event.target.value)),
                                    )
                                }
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <span>Latency multiplier</span>
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        min="0.25"
                                        max="5"
                                        step="0.25"
                                        value={latency.latencyMultiplier ?? 1}
                                        onChange={(event) =>
                                            updateLatency(
                                                'latencyMultiplier',
                                                Number(event.target.value) || 1,
                                            )
                                        }
                                        className="w-16 text-right font-mono font-black text-sm bg-white border-[2px] border-[#161616] px-1 py-0.5 text-[#ff4fa3] focus:bg-[#d8fbfe] transition-colors focus:outline-none"
                                    />
                                    <span className="text-xs font-black text-[#ff4fa3]">x</span>
                                </div>
                            </div>
                            <input
                                type="range"
                                min="0.25"
                                max="5"
                                step="0.25"
                                value={latency.latencyMultiplier ?? 1}
                                onChange={(event) =>
                                    updateLatency(
                                        'latencyMultiplier',
                                        Number(event.target.value),
                                    )
                                }
                                className="w-full accent-[#ff4fa3]"
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            Additional node latency (ms)
                            <input
                                type="number"
                                min="0"
                                max="5000"
                                className="p-1 border-[2px] border-[#161616] bg-white focus:bg-[#d8fbfe] focus:outline-none transition-colors w-full font-bold"
                                value={latency.nodeOverrideMs ?? 0}
                                onChange={(event) =>
                                    updateLatency(
                                        'nodeOverrideMs',
                                        Math.max(0, Number(event.target.value)),
                                    )
                                }
                            />
                        </label>
                        <p className="text-[10px] font-bold leading-tight text-[#161616]/60">
                            The telemetry estimate uses this technology profile
                            plus workload, concurrency, cache, and network
                            settings.
                        </p>
                    </div>
                </div>
                
                {steps.length === 0 ? (
                    <p className="mb-4 text-sm font-bold text-[#ff6b6b]">
                        No logic defined. This node will drop packets!
                    </p>
                ) : (
                    <div className="mb-6 flex flex-col gap-2">
                        {steps.map((step, index) => {
                            if (editingStepId === step.id) {
                                return (
                                    <div
                                        key={step.id}
                                        className="border-[3px] border-[#161616] bg-[#fffdf5] p-3 shadow-[4px_4px_0_#161616]"
                                    >
                                        <div className="uppercase text-[#ff4fa3] font-black border-b-[3px] border-[#161616] mb-3 pb-1">
                                            Edit Step {index + 1}
                                        </div>
                                        {renderForm(true)}
                                    </div>
                                );
                            }

                            const targetName =
                                nodes.find((n) => n.id === step.targetNodeId)
                                    ?.data.label || 'Unknown';
                            return (
                                <div
                                    key={step.id}
                                    className="flex items-start justify-between border-[3px] border-[#161616] bg-[#fffdf5] p-2 text-xs font-bold shadow-[4px_4px_0_#161616]"
                                >
                                    <div>
                                        <div className="uppercase text-[#ff4fa3] font-black border-b-2 border-[#161616] mb-1 inline-block pb-0.5">
                                            Step {index + 1}
                                        </div>
                                        <div className="mt-1">
                                            Action:{' '}
                                            <span className="uppercase text-[#161616]">
                                                {step.action}
                                            </span>{' '}
                                            {step.action === 'forward' &&
                                                `-> ${targetName}`}
                                        </div>
                                        {step.action === 'simulate-cache' && (
                                            <div>Hit Rate: {step.hitRate}%</div>
                                        )}
                                        <div className="mt-1 text-[#ffad66]">
                                            Cond: {step.condition}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => handleEditStep(step)}
                                            className="text-[#161616] hover:text-[#5de2e7] p-1 transition-colors"
                                            title="Edit Step"
                                        >
                                            <Pencil size={16} strokeWidth={3} />
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleDeleteStep(step.id)
                                            }
                                            className="text-[#161616] hover:text-[#ff6b6b] p-1 transition-colors"
                                            title="Delete Step"
                                        >
                                            <Trash2 size={16} strokeWidth={3} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {!editingStepId && (
                    <div className="border-[3px] border-[#161616] p-3 shadow-[4px_4px_0_#161616] bg-white">
                        <h4 className="mb-3 font-black uppercase text-sm border-b-[3px] border-[#161616] pb-1">
                            Add New Step
                        </h4>
                        {renderForm(false)}
                    </div>

                )}

                {/* Hardware Limits */}
                <div className="mt-4 border-[3px] border-[#161616] p-3 shadow-[4px_4px_0_#161616] bg-[#ffde59]/30">
                    <h4 className="font-black text-sm uppercase mb-3 text-[#161616] flex items-center justify-between border-b-[3px] border-[#161616] pb-1">
                        Hardware Limits
                        <span className="bg-[#ff4fa3] text-white px-2 py-0.5 text-[10px] font-black border-[2px] border-[#161616]">OOM RISK</span>
                    </h4>
                    <div className="space-y-3">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-[10px] font-black uppercase text-[#161616]/70">Memory (MB)</label>
                                <input 
                                    type="number"
                                    min="128" max="16384"
                                    value={draftMemory}
                                    onChange={(e) => setDraftMemory(parseInt(e.target.value) || 0)}
                                    className="font-mono font-black text-xs bg-white border-[2px] border-[#161616] px-1.5 py-0.5 w-20 text-right focus:bg-[#d8fbfe] transition-colors focus:outline-none"
                                />
                            </div>
                            <input 
                                type="range" min="128" max="16384" step="128"
                                value={draftMemory}
                                onChange={(e) => setDraftMemory(parseInt(e.target.value) || 0)}
                                className="w-full accent-[#161616] h-2"
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-[10px] font-black uppercase text-[#161616]/70">CPU Cores</label>
                                <input 
                                    type="number"
                                    min="1" max="64"
                                    value={draftCpu}
                                    onChange={(e) => setDraftCpu(parseInt(e.target.value) || 0)}
                                    className="font-mono font-black text-xs bg-white border-[2px] border-[#161616] px-1.5 py-0.5 w-16 text-right focus:bg-[#d8fbfe] transition-colors focus:outline-none"
                                />
                            </div>
                            <input 
                                type="range" min="1" max="64" step="1"
                                value={draftCpu}
                                onChange={(e) => setDraftCpu(parseInt(e.target.value) || 0)}
                                className="w-full accent-[#161616] h-2"
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-[10px] font-black uppercase text-[#161616]/70">Bandwidth (Kbps)</label>
                                <input 
                                    type="number"
                                    min="100" max="100000"
                                    value={draftBandwidth}
                                    onChange={(e) => setDraftBandwidth(parseInt(e.target.value) || 0)}
                                    className="font-mono font-black text-xs bg-white border-[2px] border-[#161616] px-1.5 py-0.5 w-24 text-right focus:bg-[#d8fbfe] transition-colors focus:outline-none"
                                />
                            </div>
                            <input 
                                type="range" min="100" max="100000" step="100"
                                value={draftBandwidth}
                                onChange={(e) => setDraftBandwidth(parseInt(e.target.value) || 0)}
                                className="w-full accent-[#161616] h-2"
                            />
                        </div>
                    </div>
                    <p className="text-[10px] font-bold text-[#161616]/50 leading-tight mt-2 normal-case">
                        These limits control OOM crashes, queue overflow, and bandwidth throttling during simulation.
                    </p>
                </div>

            </div>

            <div className="border-t-[3px] border-[#161616] bg-gray-50 px-4 py-3 flex gap-3">
                <button 
                    onClick={() => {
                        onUpdateNode(node.id, {
                            logicSteps: draftSteps,
                            processingDelay: draftDelay,
                            latency: draftLatency,
                            routingStrategy: draftStrategy,
                            disabled: draftDisabled,
                            errorRate: draftErrorRate,
                            hardware: { cpuCores: draftCpu, memoryMb: draftMemory },
                            bandwidthCapacity: draftBandwidth
                        });
                        onClose();
                    }}
                    className="flex-1 neo-button bg-[#5de2e7] hover:bg-[#4bcad0] py-2 flex items-center justify-center gap-2 text-sm font-black tracking-wide"
                >
                    <Save className="w-4 h-4" strokeWidth={3}/> SAVE CHANGES
                </button>
                
                {onDeleteNode && (
                    <button 
                        onClick={() => {
                            onDeleteNode(node.id);
                            onClose();
                        }}
                        className="neo-button bg-[#ff6b6b] hover:bg-[#e85b5b] px-4 flex items-center justify-center text-white"
                        title="Delete Node"
                    >
                        <Trash2 className="w-4 h-4" strokeWidth={3} />
                    </button>
                )}
            </div>
        </div>
        </div>
    );
}
