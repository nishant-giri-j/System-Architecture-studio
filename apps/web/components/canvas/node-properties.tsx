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
        logicSteps: LogicStep[],
        processingDelay?: number,
        latency?: NodeLatencyConfig,
    ) => void;
    onClose: () => void;
}

export function NodePropertiesPanel({
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

    // Get nodes connected via any edges from the current node
    const connectedTargets = useMemo(() => {
        if (!node) return [];
        return edges
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
    }, [node, edges, nodes]);

    useEffect(() => {
        if (connectedTargets.length > 0 && !targetId) {
            const firstTarget = connectedTargets[0]?.targetNode;
            if (firstTarget) setTargetId(firstTarget.id);
        }
    }, [connectedTargets, targetId]);

    if (!node) return null;

    const steps = node.data.logicSteps || [];
    const latency = node.data.latency || {};

    const updateLatency = (
        field: keyof NodeLatencyConfig,
        value: string | number,
    ) => {
        onUpdateNode(node.id, steps, node.data.processingDelay, {
            ...latency,
            [field]: value,
        });
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
            onUpdateNode(node.id, updatedSteps, node.data.processingDelay);
            setEditingStepId(null);
        } else {
            const newStep: LogicStep = {
                id: crypto.randomUUID(),
                action,
                condition,
                targetNodeId: action === 'forward' ? targetId : undefined,
                hitRate: action === 'simulate-cache' ? hitRate : undefined,
            };
            onUpdateNode(
                node.id,
                [...steps, newStep],
                node.data.processingDelay,
            );
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
        onUpdateNode(
            node.id,
            steps.filter((s) => s.id !== stepId),
            node.data.processingDelay,
        );
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
                    className="neo-input p-1"
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
                        className="neo-input p-1"
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
                        className="neo-input p-1"
                        value={hitRate}
                        onChange={(e) => setHitRate(Number(e.target.value))}
                    />
                </label>
            )}

            <label className="flex flex-col gap-1">
                Condition
                <select
                    className="neo-input p-1"
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
        <div className="neo-panel absolute right-4 top-4 bottom-4 z-[9999] flex w-80 flex-col overflow-hidden bg-white shadow-[8px_8px_0_#161616]">
            <div className="flex items-center justify-between border-b-[3px] border-[#161616] bg-[#5de2e7] p-3">
                <h3 className="font-black uppercase truncate pr-2">
                    {node.data.label} Logic
                </h3>
                <button
                    onClick={onClose}
                    className="neo-button flex-shrink-0 p-1 hover:bg-white"
                >
                    <X size={16} strokeWidth={3} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-[#f8f9fa]">
                <div className="mb-6 border-[3px] border-[#161616] p-3 shadow-[4px_4px_0_#161616] bg-white">
                    <label className="flex flex-col gap-1 text-sm font-black uppercase">
                        Simulated Processing Delay
                        <div className="flex items-center gap-2 mt-2">
                            <input
                                type="range"
                                min="0"
                                max="5000"
                                step="100"
                                value={node.data.processingDelay || 0}
                                onChange={(e) =>
                                    onUpdateNode(
                                        node.id,
                                        steps,
                                        parseInt(e.target.value),
                                    )
                                }
                                className="w-full accent-[#ff4fa3]"
                            />
                            <span className="w-16 text-right whitespace-nowrap text-[#ff4fa3]">
                                {node.data.processingDelay || 0}ms
                            </span>
                        </div>
                        <span className="text-[10px] font-bold text-[#161616]/70 leading-tight mt-1 normal-case">
                            Make this node slower to observe latency
                            bottlenecks.
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
                                className="neo-input p-1"
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
                        <label className="flex flex-col gap-1">
                            Cache hit rate (%): {latency.cacheHitRate ?? 80}
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
                                className="accent-[#9cf57a]"
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            Concurrent requests
                            <input
                                type="number"
                                min="1"
                                max="1000"
                                className="neo-input p-1"
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
                                className="neo-input p-1"
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
                            Latency multiplier: {latency.latencyMultiplier ?? 1}
                            x
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
                                className="accent-[#ff4fa3]"
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            Additional node latency (ms)
                            <input
                                type="number"
                                min="0"
                                max="5000"
                                className="neo-input p-1"
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
                    <p className="mb-4 text-sm font-bold text-gray-500">
                        No logic defined. Will use default fallback behavior.
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
            </div>
        </div>
    );
}
