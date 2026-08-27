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

  // Unconnected nodes
  nodes.forEach(node => {
    const isConnected = edges.some(e => e.source === node.id || e.target === node.id);
    if (!isConnected) {
      warnings.push({
        id: `unconnected-${node.id}`,
        message: `Node "${node.data.label}" is not connected to anything.`,
        nodeId: node.id
      });
    }
  });

  edges.forEach(edge => {
    const sourceTech = getTech(edge.source);
    const targetTech = getTech(edge.target);
    const sourceNode = getNode(edge.source);
    const targetNode = getNode(edge.target);

    if (!sourceTech || !targetTech || !sourceNode || !targetNode) return;

    // Rule 1: Client -> Data
    if (sourceTech.category === "client" && targetTech.category === "data") {
      warnings.push({
        id: `client-data-${edge.id}`,
        message: `Security Risk: Client (${sourceNode.data.label}) directly connected to Database (${targetNode.data.label}). Use an API service instead.`,
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
