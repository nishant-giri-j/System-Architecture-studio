"use client";

import { memo } from "react";
import { NodeResizeControl, type NodeProps, type Node } from "@xyflow/react";
import { SquareDashed } from "lucide-react";

export type BoundaryNodeData = {
  label: string;
  color: string;
  description?: string;
};

export type BoundaryFlowNode = Node<BoundaryNodeData, "boundary">;

const controlStyle = {
  background: 'transparent',
  border: 'none',
};

function BoundaryNodeComponent({ data, selected }: NodeProps<BoundaryFlowNode>) {
  return (
    <>
      <NodeResizeControl style={controlStyle} minWidth={200} minHeight={150}>
        <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-[#161616]" />
      </NodeResizeControl>

      <div
        className="w-full h-full relative"
        style={{
          border: `4px dashed ${data.color}`,
          backgroundColor: `${data.color}10`, // 10% opacity
          outline: selected ? "4px solid #ff4fa3" : "none",
          outlineOffset: "4px",
          zIndex: -1, // Keep behind normal nodes
        }}
      >
        <div 
          className="absolute -top-4 left-4 px-3 py-1 border-[3px] border-[#161616] flex items-center gap-2"
          style={{ backgroundColor: data.color, color: data.color === '#161616' ? '#fff' : '#161616' }}
        >
          <SquareDashed size={16} strokeWidth={3} />
          <span className="font-black uppercase tracking-wide text-xs">{data.label}</span>
        </div>
      </div>
    </>
  );
}

export const BoundaryNode = memo(BoundaryNodeComponent);
