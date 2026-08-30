import dagre from 'dagre';
import { type Node, type Edge, Position } from '@xyflow/react';

const nodeWidth = 250;
const nodeHeight = 80;

export const getLayoutedElements = (nodes: Node[], edges: Edge[], direction: 'LR' | 'TB' | 'RL' | 'BT' = 'LR') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const newNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        
        let targetPosition;
        let sourcePosition;

        if (direction === 'LR') {
            targetPosition = Position.Left;
            sourcePosition = Position.Right;
        } else if (direction === 'RL') {
            targetPosition = Position.Right;
            sourcePosition = Position.Left;
        } else if (direction === 'TB') {
            targetPosition = Position.Top;
            sourcePosition = Position.Bottom;
        } else {
            // BT
            targetPosition = Position.Bottom;
            sourcePosition = Position.Top;
        }

        return {
            ...node,
            targetPosition,
            sourcePosition,
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
            },
        };
    });

    return { nodes: newNodes, edges };
};
