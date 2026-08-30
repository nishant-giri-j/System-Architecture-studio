'use client';

import {
    BaseEdge,
    getBezierPath,
    getSmoothStepPath,
    getStraightPath,
    useReactFlow,
    type Edge,
    type EdgeProps,
} from '@xyflow/react';

export type EventEdgeData = {
    event: string;
    protocol?: string;
    edgeStyle?: 'bezier' | 'step' | 'straight' | 'smoothstep';
    isPaused?: boolean;
    playbackSpeed?: number;
    pulses?: Array<{
        id: string;
        reverse: boolean;
        type: string;
        color: string;
        travelDurationMs?: number;
        statusCode?: number;
        protocol?: string;
        size?: number;
    }>;
    isHighlightedError?: boolean;
};

export type EventFlowEdge = Edge<EventEdgeData, 'event'>;

export function EventEdge({
    id,
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    markerEnd,
    data,
    selected,
    animated,
}: EdgeProps<EventFlowEdge>) {
    const { screenToFlowPosition, setEdges } = useReactFlow();

    let edgePath = '';
    let labelX = 0;
    let labelY = 0;

    const pathParams = {
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    };

    if (data?.edgeStyle === 'step') {
        const result = getSmoothStepPath({ ...pathParams, borderRadius: 0 });
        edgePath = result[0];
        labelX = result[1];
        labelY = result[2];
    } else if (data?.edgeStyle === 'smoothstep') {
        const result = getSmoothStepPath({ ...pathParams, borderRadius: 16 });
        edgePath = result[0];
        labelX = result[1];
        labelY = result[2];
    } else if (data?.edgeStyle === 'straight') {
        const result = getStraightPath({ sourceX, sourceY, targetX, targetY });
        edgePath = result[0];
        labelX = result[1];
        labelY = result[2];
    } else {
        const result = getBezierPath(pathParams);
        edgePath = result[0];
        labelX = result[1];
        labelY = result[2];
    }

    const stroke = data?.isHighlightedError ? '#ff6b6b' : selected ? '#ff4fa3' : '#161616';

    return (
        <>
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                className={animated ? 'flowing-ants' : (data?.isHighlightedError ? 'animate-pulse' : '')}
                style={{
                    stroke,
                    strokeWidth: data?.isHighlightedError ? 6 : selected ? 5 : 3,
                    strokeDasharray: animated ? '12 12' : undefined,
                    animationPlayState: data?.isPaused ? 'paused' : 'running',
                }}
            />
            {data?.event && (
                <g transform={`translate(${labelX}, ${labelY})`}>
                    <rect
                        x={-48}
                        y={-15}
                        width={96}
                        height={30}
                        fill={selected ? '#ffde59' : '#ffffff'}
                        stroke="#161616"
                        strokeWidth={2.5}
                        rx={0}
                    />
                    <text
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="11"
                        fontWeight="800"
                        fill="#161616"
                    >
                        {data.event}
                    </text>
                </g>
            )}
            {data?.pulses?.map((pulse) => {
                const protocol = pulse.protocol || data?.protocol || 'HTTP';
                const isSQL = protocol.toUpperCase().includes('SQL');
                const isStream = protocol.toUpperCase().includes('GRPC') || protocol.toUpperCase().includes('WEBSOCKET');
                const width = pulse.size || 56;
                const isFast = (pulse.travelDurationMs ?? 960) < 500;
                
                return (
                <g
                    key={pulse.id}
                    style={{
                        offsetPath: `path('${edgePath}')`,
                        animationName: pulse.reverse ? 'travelBackward' : 'travelForward',
                        animationDuration: `${(pulse.travelDurationMs ?? 960) / Math.max(0.1, data?.playbackSpeed ?? 1)}ms`,
                        animationTimingFunction: 'linear',
                        animationFillMode: 'forwards',
                        animationPlayState: data?.isPaused ? 'paused' : 'running',
                        offsetRotate: 'auto',
                        filter: isFast ? 'url(#motion-blur) drop-shadow(0px 0px 4px rgba(0,0,0,0.2))' : undefined,
                    } as React.CSSProperties}
                >
                    {isSQL ? (
                        <g transform={`scale(${Math.max(1, width / 40)})`}>
                            <path
                                d="M-15,-8 C-15,-11 15,-11 15,-8 L15,8 C15,11 -15,11 -15,8 Z"
                                fill={pulse.color}
                                stroke="#161616"
                                strokeWidth="2"
                            />
                            <ellipse cx="0" cy="-8" rx="15" ry="3" fill="rgba(255,255,255,0.3)" stroke="#161616" strokeWidth="2" />
                        </g>
                    ) : isStream ? (
                        <rect
                            x={-width / 2}
                            y={-5}
                            width={width}
                            height={10}
                            fill={pulse.color}
                            stroke="#161616"
                            strokeWidth="2"
                            rx="5"
                            strokeDasharray="6 4"
                            style={{ filter: `drop-shadow(0px 0px 4px ${pulse.color})` }}
                        />
                    ) : (
                        <rect
                            x={-width / 2}
                            y={-10}
                            width={width}
                            height={20}
                            fill={pulse.color}
                            stroke="#161616"
                            strokeWidth="2.5"
                            rx="6"
                        />
                    )}
                    <text
                        x={0}
                        y={1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={isSQL ? "6" : "8"}
                        fontWeight="900"
                        fill="#161616"
                        className="uppercase"
                    >
                        {pulse.statusCode || protocol}
                    </text>
                </g>
            )})}
        </>
    );
}

