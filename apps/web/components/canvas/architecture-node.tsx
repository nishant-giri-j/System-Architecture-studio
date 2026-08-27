'use client';

import { Handle, type Node, type NodeProps, Position } from '@xyflow/react';
import {
    Activity,
    Box,
    Database,
    HardDrive,
    MonitorSmartphone,
    Network,
    Server,
    Shield,
    SquareDashed,
    Zap,
} from 'lucide-react';
import { memo, useContext } from 'react';
import { TechContext } from './tech-context';

import type { LogicStep, NodeLatencyConfig } from '@architecture-studio/shared';

export type ArchitectureNodeData = {
    label: string;
    technologyId: string;
    color: string;
    description?: string;
    logicSteps?: LogicStep[];
    processingTime?: number;
    processingDelay?: number;
    latency?: NodeLatencyConfig;
    isBottleneck?: boolean;
};

export type ArchitectureFlowNode = Node<ArchitectureNodeData, 'architecture'>;

const iconByCategory: Record<
    string,
    React.ComponentType<{ size?: number; strokeWidth?: number }>
> = {
    client: MonitorSmartphone,
    network: Network,
    service: Server,
    data: Database,
    messaging: Zap,
    cache: HardDrive,
    storage: Box,
    observability: Activity,
    security: Shield,
    boundary: SquareDashed,
    compute: Server,
};

function ArchitectureNodeComponent({
    data,
    selected,
}: NodeProps<ArchitectureFlowNode>) {
    const technologies = useContext(TechContext);
    const tech = technologies.find((t) => t.id === data.technologyId);
    const Icon = tech ? (iconByCategory[tech.category] ?? Server) : Server;

    return (
        <article
            className="relative min-w-48 border-[3px] border-[#161616] bg-[#fffdf5] p-3 shadow-[5px_5px_0_#161616] transition-transform duration-100 hover:-translate-y-0.5"
            style={{
                outline: selected ? '4px solid #ff4fa3' : 'none',
                outlineOffset: '3px',
            }}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="!h-4 !w-4 !border-[3px] !border-[#161616] !bg-[#ffde59]"
            />
            <div className="flex items-center gap-3">
                <div
                    className="grid h-11 w-11 place-items-center border-[3px] border-[#161616]"
                    style={{ backgroundColor: data.color }}
                >
                    <Icon size={24} strokeWidth={3} />
                </div>
                <div className="min-w-0">
                    <p className="m-0 truncate text-sm font-black uppercase tracking-wide">
                        {data.label}
                    </p>
                    <p className="m-0 mt-1 truncate text-[11px] font-bold uppercase text-neutral-600">
                        {data.technologyId.replaceAll('-', ' ')}
                    </p>
                </div>
            </div>
            {data.description ? (
                <p className="m-0 mt-3 text-xs font-semibold">
                    {data.description}
                </p>
            ) : null}
            <Handle
                type="source"
                position={Position.Right}
                className="!h-4 !w-4 !border-[3px] !border-[#161616] !bg-[#ff4fa3]"
            />
        </article>
    );
}

export const ArchitectureNode = memo(ArchitectureNodeComponent);
