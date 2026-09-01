import dagre from 'dagre';
import { type Node, type Edge, Position } from '@xyflow/react';

const defaultWidth = 360;
const defaultHeight = 240;

export const getLayoutedElements = (nodes: Node[], edges: Edge[], direction: 'LR' | 'TB' | 'RL' | 'BT' = 'LR') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    
    // Configured for beautiful, spacious, sweeping flows
    dagreGraph.setGraph({ 
        rankdir: direction,
        ranksep: 200,    // Very generous spacing between layers for sweeping edge curves
        nodesep: 120,    // Breathing room between siblings
        edgesep: 80,     // Space out the edges
        ranker: 'network-simplex', // Produces the most balanced trees
    });

    // We store the dynamic sizes to use them correctly during position mapping
    const nodeSizes = new Map<string, { w: number, h: number }>();

    nodes.forEach((node) => {
        // Use React Flow's actual rendered measurements if available! 
        // This makes the layout perfectly hug each unique node's content.
        // We add +20px padding to account for the heavy brutalist drop shadows.
        const w = (node.measured?.width ?? node.width ?? defaultWidth) + 20;
        const h = (node.measured?.height ?? node.height ?? defaultHeight) + 20;
        
        nodeSizes.set(node.id, { w, h });
        dagreGraph.setNode(node.id, { width: w, height: h });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const newNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        const { w, h } = nodeSizes.get(node.id)!;
        
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
                x: nodeWithPosition.x - w / 2,
                y: nodeWithPosition.y - h / 2,
            },
        };
    });

    return { nodes: newNodes, edges };
};
