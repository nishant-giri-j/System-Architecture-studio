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
    routingStrategy?: 'broadcast' | 'load-balance';
    isBottleneck?: boolean;
    isHighlightedError?: boolean;
    isFrozen?: boolean;
    isOffline?: boolean;
    disabled?: boolean;
    queueLength?: number;
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
    
    // Determine queue capacity for coloring
    const isMessaging = tech?.category === 'messaging';
    const queueLimit = isMessaging ? 5000 : (tech?.category === 'data' ? 100 : 50);
    const queueRatio = (data.queueLength || 0) / queueLimit;
    const queueColor = queueRatio > 0.8 ? '#ff6b6b' : queueRatio > 0.4 ? '#ffad66' : '#ffde59';

    return (
        <article
            className={`relative min-w-48 border-[3px] border-[#161616] bg-[#fffdf5] p-3 shadow-[5px_5px_0_#161616] transition-transform duration-100 hover:-translate-y-0.5 ${data.isHighlightedError ? 'animate-pulse' : ''} ${data.isOffline ? 'grayscale opacity-60' : ''}`}
            style={{
                outline: data.isHighlightedError ? '4px solid #ff6b6b' : selected ? '4px solid #ff4fa3' : 'none',
                outlineOffset: '3px',
                boxShadow: data.isHighlightedError ? '0 0 20px rgba(255, 107, 107, 0.8), 5px 5px 0 #161616' : undefined,
            }}
        >
            {/* Visual Queue Indicator */}
            {(data.queueLength ?? 0) > 0 && tech?.category !== 'client' && (
                <div 
                    className="absolute -top-3 -left-3 border-[3px] border-[#161616] px-2 py-0.5 text-[10px] font-black uppercase text-[#161616] shadow-[2px_2px_0_#161616] z-10 animate-in zoom-in"
                    style={{ backgroundColor: queueColor }}
                >
                    Queue: {data.queueLength}
                </div>
            )}
            
            {/* Disabled Indicator for Clients */}
            {data.disabled && tech?.category === 'client' && (
                <div 
                    className="absolute -top-3 -right-3 border-[3px] border-[#161616] bg-[#161616] px-2 py-0.5 text-[10px] font-black uppercase text-[#fffdf5] shadow-[2px_2px_0_#ff6b6b] z-10"
                >
                    OFFLINE
                </div>
            )}

            {/* Visual Traffic Jam Dots */}
            {(data.queueLength ?? 0) > 0 && tech?.category !== 'client' && (
                <div className="absolute top-1/2 -left-16 -translate-y-1/2 w-14 h-12 flex flex-wrap-reverse justify-end content-center gap-[2px] pointer-events-none z-0">
                    {Array.from({ length: Math.min(data.queueLength!, 30) }).map((_, i) => (
                        <div 
                            key={i} 
                            className="w-2 h-2 rounded-full border-[1px] border-[#161616]"
                            style={{ backgroundColor: queueColor }}
                        />
                    ))}
                </div>
            )}
            
            {data.isFrozen && !data.isOffline && (
                <div 
                    className="absolute -bottom-3 -right-3 border-[3px] border-[#161616] bg-[#5de2e7] px-2 py-0.5 text-[10px] font-black uppercase text-[#161616] shadow-[2px_2px_0_#161616] z-10 animate-pulse"
                >
                    🐒 Chaos Block!
                </div>
            )}

            {data.isOffline && (
                <div 
                    className="absolute -bottom-3 -right-3 border-[3px] border-[#161616] bg-[#ff6b6b] px-2 py-0.5 text-[10px] font-black uppercase text-[#fffdf5] shadow-[2px_2px_0_#161616] z-10 animate-pulse"
                >
                    ❌ OFFLINE
                </div>
            )}
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
