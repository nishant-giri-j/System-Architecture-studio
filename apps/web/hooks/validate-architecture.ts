import type { TechnologyDefinition } from "@architecture-studio/shared";
import type { ArchitectureFlowNode } from "../components/canvas/architecture-node";
import type { EventFlowEdge } from "../components/canvas/event-edge";

export type ArchitectureWarning = {
  id: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
};

export function validateArchitecture(
  nodes: ArchitectureFlowNode[],
  edges: EventFlowEdge[],
  technologies: TechnologyDefinition[]
): ArchitectureWarning[] {
  const warnings: ArchitectureWarning[] = [];

  const getTech = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;
    return technologies.find(t => t.id === node.data.technologyId) || null;
  };

  const getNode = (nodeId: string) => nodes.find(n => n.id === nodeId);

  let hasDataNode = false;

  nodes.forEach(node => {
    const tech = getTech(node.id);
    const incomingEdges = edges.filter(e => e.target === node.id);
    const outgoingEdges = edges.filter(e => e.source === node.id);
    const isConnected = incomingEdges.length > 0 || outgoingEdges.length > 0;

    if (tech?.category === 'data') hasDataNode = true;

    // 1. Unconnected nodes
    if (!isConnected) {
      warnings.push({
        id: `unconnected-${node.id}`,
        message: `Node "${node.data.label}" is floating and not connected to anything.`,
        nodeId: node.id
      });
    }

    // 2. Missing Logic Steps (Node drops packets)
    // Only applies if it has outgoing edges (meaning it's supposed to route somewhere)
    if (outgoingEdges.length > 0 && (!node.data.logicSteps || node.data.logicSteps.length === 0)) {
       // Databases typically don't route, but if they have an outgoing edge, they still need logic
       warnings.push({
         id: `no-logic-${node.id}`,
         message: `Configuration Error: "${node.data.label}" has outgoing connections but no Logic Steps defined. It will drop all packets!`,
         nodeId: node.id
       });
    }

    // 3. Queue without Consumer
    if (tech?.category === 'messaging' && outgoingEdges.length === 0) {
        warnings.push({
            id: `unconsumed-queue-${node.id}`,
            message: `Dead Letter: Queue/Stream "${node.data.label}" has no consumers (no outgoing connections). Messages will pile up.`,
            nodeId: node.id
        });
    }

    // 4. Queue without Publisher
    if (tech?.category === 'messaging' && incomingEdges.length === 0) {
        warnings.push({
            id: `empty-queue-${node.id}`,
            message: `Idle Resource: Queue/Stream "${node.data.label}" has no publishers sending messages to it.`,
            nodeId: node.id
        });
    }

    // 5. Hardware Bottleneck Checks
    if (node.data.hardware) {
        if (tech?.category === 'data' && node.data.hardware.memoryMb < 512) {
            warnings.push({
                id: `low-mem-db-${node.id}`,
                message: `Hardware Risk: Database "${node.data.label}" is allocated very low memory (${node.data.hardware.memoryMb}MB). Expect OOM crashes under load.`,
                nodeId: node.id
            });
        }
        if (node.data.hardware.cpuCores < 2 && (tech?.category === 'compute' || tech?.category === 'service')) {
            warnings.push({
                id: `low-cpu-server-${node.id}`,
                message: `Hardware Risk: Service "${node.data.label}" has only ${node.data.hardware.cpuCores} core(s). Expect heavy queuing and latency delays.`,
                nodeId: node.id
            });
        }
        
        if (node.data.bandwidthCapacity && node.data.bandwidthCapacity < 10000 && (tech?.category === 'data' || tech?.category === 'storage')) {
            warnings.push({
                id: `low-bandwidth-db-${node.id}`,
                message: `Hardware Risk: Database "${node.data.label}" is limited to ${node.data.bandwidthCapacity} Kbps bandwidth. High risk of severe network congestion and throttling under heavy loads.`,
                nodeId: node.id
            });
        }
    }

    // 6. High Error Rate Intentionally Set
    if (node.data.errorRate && node.data.errorRate > 0) {
        warnings.push({
            id: `high-error-${node.id}`,
            message: `Chaos Active: "${node.data.label}" is intentionally dropping ${Math.round(node.data.errorRate * 100)}% of traffic.`,
            nodeId: node.id
        });
    }
  });

  // Global Check: No database
  if (!hasDataNode && nodes.length > 2) {
      warnings.push({
          id: `no-database`,
          message: `Stateless System: Your architecture has no Databases or Storage. Where is user data being persisted?`
      });
  }

  edges.forEach(edge => {
    const sourceTech = getTech(edge.source);
    const targetTech = getTech(edge.target);
    const sourceNode = getNode(edge.source);
    const targetNode = getNode(edge.target);

    if (!sourceTech || !targetTech || !sourceNode || !targetNode) return;

    // 7. Dead Edge (Connected in UI but no logic step routes to it)
    if (sourceNode.data.logicSteps && sourceNode.data.logicSteps.length > 0) {
        // Some nodes use broadcast which routes to ALL edges
        const usesBroadcast = sourceNode.data.routingStrategy === 'broadcast';
        const hasExplicitTarget = sourceNode.data.logicSteps.some(step => step.targetNodeId === targetNode.id);
        
        if (!usesBroadcast && !hasExplicitTarget) {
            warnings.push({
                id: `dead-edge-${edge.id}`,
                message: `Dead Edge: You connected "${sourceNode.data.label}" to "${targetNode.data.label}", but no Logic Step routes traffic there. It will never be used.`,
                edgeId: edge.id
            });
        }
    }

    // Rule 1: Client -> Data
    if (sourceTech.category === "client" && (targetTech.category === "data" || targetTech.category === "storage")) {
      warnings.push({
        id: `client-data-${edge.id}`,
        message: `Security Risk: Client (${sourceNode.data.label}) directly connected to Database/Storage (${targetNode.data.label}). Use an API service instead.`,
        edgeId: edge.id
      });
    }

    // Rule 2: Client -> Cache
    if (sourceTech.category === "client" && targetTech.category === "cache") {
      warnings.push({
        id: `client-cache-${edge.id}`,
        message: `Architecture: Client (${sourceNode.data.label}) directly connected to Cache (${targetNode.data.label}). Usually, an API handles caching.`,
        edgeId: edge.id
      });
    }

    // Rule 3: Network -> Data
    if (sourceTech.category === "network" && targetTech.category === "data") {
      warnings.push({
        id: `network-data-${edge.id}`,
        message: `Architecture: Load Balancer (${sourceNode.data.label}) routing directly to Database (${targetNode.data.label}). Route to a service layer instead.`,
        edgeId: edge.id
      });
    }

    // Rule 4: Messaging target is Data (sometimes valid, but typically workers consume messages)
    if (sourceTech.category === "messaging" && targetTech.category === "data") {
      warnings.push({
        id: `messaging-data-${edge.id}`,
        message: `Architecture: Queue (${sourceNode.data.label}) connected directly to Database (${targetNode.data.label}). Usually a Worker Service consumes messages and writes to DB.`,
        edgeId: edge.id
      });
    }

    // Rule 5: Reverse connection Data -> Client
    if (sourceTech.category === "data" && targetTech.category === "client") {
      warnings.push({
        id: `data-client-${edge.id}`,
        message: `Invalid Flow: Database (${sourceNode.data.label}) initiating request to Client (${targetNode.data.label}).`,
        edgeId: edge.id
      });
    }
    
    // Rule 6: Worker/Compute -> Client
    if (sourceTech.category === "compute" && targetTech.category === "client") {
        warnings.push({
          id: `worker-client-${edge.id}`,
          message: `Architecture: Background Compute (${sourceNode.data.label}) directly responding to Client (${targetNode.data.label}). Background tasks should usually notify via WebSockets, DB, or PubSub.`,
          edgeId: edge.id
        });
    }
  });

  return warnings;
}

export function isValidConnection(
  sourceNode: ArchitectureFlowNode,
  targetNode: ArchitectureFlowNode,
  technologies: TechnologyDefinition[]
): { valid: boolean; message?: string } {
  const sourceTech = technologies.find(t => t.id === sourceNode.data.technologyId);
  const targetTech = technologies.find(t => t.id === targetNode.data.technologyId);

  if (!sourceTech || !targetTech) return { valid: true };

  // Rule 1: Client -> Data
  if (sourceTech.category === "client" && targetTech.category === "data") {
    return { valid: false, message: `Security Risk: Client (${sourceNode.data.label}) cannot connect directly to Database (${targetNode.data.label}). Route through an API.` };
  }

  // Rule 2: Client -> Cache
  if (sourceTech.category === "client" && targetTech.category === "cache") {
    return { valid: false, message: `Architecture: Client (${sourceNode.data.label}) cannot connect directly to Cache (${targetNode.data.label}). Usually an API handles caching.` };
  }

  // Rule 3: Network -> Data
  if (sourceTech.category === "network" && targetTech.category === "data") {
    return { valid: false, message: `Architecture: Load Balancer (${sourceNode.data.label}) cannot route directly to Database (${targetNode.data.label}). Route to a service layer.` };
  }

  // Rule 4: Messaging -> Data
  if (sourceTech.category === "messaging" && targetTech.category === "data") {
    return { valid: false, message: `Architecture: Queue (${sourceNode.data.label}) cannot write directly to Database (${targetNode.data.label}). A Worker Service must consume messages.` };
  }

  // Rule 5: Data -> Anything (Data can't initiate requests)
  if (sourceTech.category === "data") {
    return { valid: false, message: `Invalid Flow: Database (${sourceNode.data.label}) cannot initiate a request to ${targetNode.data.label}.` };
  }

  // Rule 6: Cache -> Client
  if (sourceTech.category === "cache" && targetTech.category === "client") {
    return { valid: false, message: `Invalid Flow: Cache (${sourceNode.data.label}) cannot initiate a request to Client (${targetNode.data.label}).` };
  }

  return { valid: true };
}
