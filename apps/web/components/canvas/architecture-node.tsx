'use client';

import { Handle, type Node, type NodeProps, Position } from '@xyflow/react';
import {
    Activity,
    Box,
    Database,
    Globe,
    HardDrive,
    MonitorSmartphone,
    AppWindow,
    Network,
    Server,
    ServerCog,
    Shield,
    SquareDashed,
    Webhook,
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
    errorRate?: number;
    isBottleneck?: boolean;
    isHighlightedError?: boolean;
    isFrozen?: boolean;
    isOffline?: boolean;
    disabled?: boolean;
    queueLength?: number;
    hardware?: { cpuCores: number; memoryMb: number; };
    bandwidthCapacity?: number;
};

export type ArchitectureFlowNode = Node<ArchitectureNodeData, 'architecture'>;

const iconByCategory: Record<
    string,
    React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
> = {
    client: AppWindow,
    network: Globe,
    service: ServerCog,
    data: Database,
    messaging: Webhook,
    cache: Zap,
    storage: HardDrive,
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
    const cat = tech?.category || 'service';
    const Icon = iconByCategory[cat] ?? Server;
    
    // Determine queue capacity for coloring
    const isMessaging = cat === 'messaging';
    const queueLimit = isMessaging ? 5000 : (cat === 'data' ? 100 : 50);
    const queueRatio = (data.queueLength || 0) / queueLimit;
    const queueColor = queueRatio > 0.8 ? '#ff6b6b' : queueRatio > 0.4 ? '#ffad66' : '#ffde59';

    // Shape specific classes
    let shapeClasses = 'rounded-none';
    let borderClasses = 'border-[3px] border-[#161616]';
    
    if (cat === 'data' || cat === 'cache' || cat === 'storage') {
        shapeClasses = 'rounded-t-md rounded-b-[40px]'; // Looks like a cylinder/drive
    } else if (cat === 'network' || cat === 'boundary') {
        shapeClasses = 'rounded-tl-[40px] rounded-br-[40px] rounded-tr-md rounded-bl-md'; // Leaf / aerodynamic routing shape
    } else if (cat === 'messaging') {
        shapeClasses = 'rounded-[40px]'; // Pill/Capsule shape
        borderClasses = 'border-[3px] border-dashed border-[#161616]';
    } else if (cat === 'client') {
        shapeClasses = 'rounded-t-xl rounded-b-md'; // Browser window
    }

    const isOfflineStyle = data.isOffline ? 'grayscale opacity-60' : '';
    const isErrorStyle = data.isHighlightedError ? 'animate-pulse' : '';
    
    const nodeColor = data.color || '#ffde59';

    return (
        <div className={`relative w-80 transition-transform duration-100 hover:-translate-y-0.5 ${isOfflineStyle} ${isErrorStyle}`}>
            
            {/* Visual Queue Indicator */}
            {(data.queueLength ?? 0) > 0 && cat !== 'client' && (
                <div 
                    className="absolute -top-3 -left-3 border-[3px] border-[#161616] px-2 py-0.5 text-[10px] font-black uppercase text-[#161616] shadow-[2px_2px_0_#161616] z-10 animate-in zoom-in"
                    style={{ backgroundColor: queueColor }}
                >
                    Queue: {data.queueLength}
                </div>
            )}
            
            {/* Disabled Indicator for Clients */}
            {data.disabled && cat === 'client' && (
                <div 
                    className="absolute -top-3 -right-3 border-[3px] border-[#161616] bg-[#161616] px-2 py-0.5 text-[10px] font-black uppercase text-[#fffdf5] shadow-[2px_2px_0_#ff6b6b] z-10"
                >
                    OFFLINE
                </div>
            )}

            {/* Visual Traffic Jam Dots */}
            {(data.queueLength ?? 0) > 0 && cat !== 'client' && (
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
                id="left"
                type="target"
                position={Position.Left}
                className="!h-4 !w-4 !border-[3px] !border-[#161616] !bg-[#ffde59]"
            />

            {/* Main Node Body */}
            <div 
                className={`flex flex-col bg-[#fffdf5] overflow-hidden ${shapeClasses} ${borderClasses}`}
                style={{
                    boxShadow: data.isHighlightedError ? '0 0 20px rgba(255, 107, 107, 0.8), 6px 6px 0 #161616' : '6px 6px 0 #161616',
                    outline: data.isHighlightedError ? '4px solid #ff6b6b' : selected ? '4px solid #ff4fa3' : 'none',
                    outlineOffset: '2px',
                }}
            >
                {/* Fake Browser Top Bar for Clients */}
                {cat === 'client' && (
                    <div className="bg-[#161616] px-3 py-2 flex items-center gap-1.5 w-full">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ff6b6b]"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ffde59]"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-[#9cf57a]"></div>
                    </div>
                )}

                {/* Colored Header Block */}
                <div 
                    className={`flex items-center gap-3 p-3 border-b-[3px] border-[#161616] ${cat === 'messaging' ? 'px-5' : ''}`}
                    style={{ backgroundColor: nodeColor }}
                >
                    <div className="grid h-12 w-12 shrink-0 place-items-center bg-[#fffdf5] border-[3px] border-[#161616] shadow-[2px_2px_0_#161616]">
                        <Icon size={24} strokeWidth={2.5} className="text-[#161616]" />
                    </div>
                    
                    {/* Contrasting Text Blocks to fix illegibility on dark colors */}
                    <div className="min-w-0 flex-1 flex flex-col items-start gap-1">
                        <div className="bg-[#fffdf5] px-2 py-0.5 border-[2px] border-[#161616] shadow-[2px_2px_0_#161616] max-w-full">
                            <p className="m-0 truncate text-[14px] leading-tight font-black uppercase tracking-wide text-[#161616]">
                                {data.label}
                            </p>
                        </div>
                        <div className="bg-[#161616] px-2 py-0.5 max-w-full shadow-[2px_2px_0_#fffdf5]">
                            <p className="m-0 truncate text-[10px] font-bold uppercase text-[#9cf57a]">
                                {data.technologyId.replaceAll('-', ' ')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Description Body */}
                {data.description ? (
                    <div className={`p-3 bg-[#fffdf5] ${cat === 'messaging' ? 'px-5 pb-5' : ''}`}>
                        <p className="m-0 text-xs font-bold text-gray-700 leading-snug">
                            {data.description}
                        </p>
                    </div>
                ) : (
                    <div className="h-2 bg-[#fffdf5]"></div>
                )}
            </div>

            <Handle
                id="right"
                type="source"
                position={Position.Right}
                className="!h-4 !w-4 !border-[3px] !border-[#161616] !bg-[#ff4fa3]"
            />
        </div>
    );
}

export const ArchitectureNode = memo(ArchitectureNodeComponent);
