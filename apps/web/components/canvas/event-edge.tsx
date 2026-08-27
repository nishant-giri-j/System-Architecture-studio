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
    }>;
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

    const stroke = selected ? '#ff4fa3' : '#161616';

    return (
        <>
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                className={animated ? 'flowing-ants' : ''}
                style={{
                    stroke,
                    strokeWidth: selected ? 5 : 3,
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
            {data?.pulses?.map((pulse) => (
                <g
                    key={pulse.id}
                    style={{
                        offsetPath: `path('${edgePath}')`,
                        animation: `${pulse.reverse ? 'travelBackward' : 'travelForward'} ${(pulse.travelDurationMs ?? 960) / Math.max(0.1, data?.playbackSpeed ?? 1)}ms linear forwards`,
                        offsetRotate: 'auto',
                        animationPlayState: data?.isPaused
                            ? 'paused'
                            : 'running',
                    }}
                >
                    <rect
                        x={-28}
                        y={-10}
                        width={56}
                        height={20}
                        fill={pulse.color}
                        stroke="#161616"
                        strokeWidth="2.5"
                        rx="6"
                    />
                    <text
                        x={0}
                        y={1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="8"
                        fontWeight="900"
                        fill="#161616"
                        className="uppercase"
                    >
                        {data?.protocol || 'HTTP'}
                    </text>
                </g>
            ))}
        </>
    );
}

