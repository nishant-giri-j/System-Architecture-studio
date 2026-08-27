import re

with open("packages/shared/src/technology-info.ts", "r", encoding="utf-8") as f:
    tech_content = f.read()
    
# Replace the getTechnologyInfo function entirely using regex
tech_pattern = r'export function getTechnologyInfo.*?\}'

new_tech_func = """export function getTechnologyInfo(techId: string, category: string, label: string): TechnologyInfo {
  if (curatedTechnologyInfo[techId]) {
    return curatedTechnologyInfo[techId];
  }
  
  if (generatedTechData[techId]) {
    return generatedTechData[techId];
  }

  return {
    overview: `A ${category} component providing ${label} capabilities to the architecture.`,
    howItWorks: `Operates as a standard ${category} layer element, interacting with upstream and downstream components via defined protocols.`,
    useCases: [`Typical ${category} scenarios`, `Enterprise ${label} deployments`],
    advantages: ["Purpose-built for its category", "Industry standard adoption"],
    disadvantages: ["May introduce architectural complexity", "Requires operational maintenance"],
    performance: "Performance characteristics vary based on infrastructure provisioning and load.",
    security: "Follows standard security practices for its deployment environment.",
    alternatives: ["Various cloud-native or open-source equivalents"]
  };
}"""

tech_content = re.sub(tech_pattern, new_tech_func, tech_content, flags=re.DOTALL)

with open("packages/shared/src/technology-info.ts", "w", encoding="utf-8") as f:
    f.write(tech_content)


with open("packages/shared/src/protocol.ts", "r", encoding="utf-8") as f:
    prot_content = f.read()

prot_pattern = r'export function getProtocolInfo.*?\}'

new_prot_func = """export function getProtocolInfo(id: string): ProtocolDefinition {
  const existing = protocolLibrary.find(p => p.id === id || p.label === id);
  if (existing) return existing;
  
  if (generatedProtocolData[id]) {
    return {
      id,
      label: id,
      category: "Protocol",
      ...generatedProtocolData[id]
    };
  }

  return {
    id,
    label: id,
    category: "Protocol",
    overview: `The ${id} protocol facilitates specialized communication and data transfer between components in the architecture.`,
    transport: "Varies depending on implementation",
    communicationStyle: "Standard for the protocol type",
    useCases: ["System integration", "Data exchange", "Inter-process communication"],
    advantages: ["Provides standardized communication guarantees for its domain", "Industry recognized standard"],
    disadvantages: ["Requires specific driver, client library, or open port support", "May add parsing/serialization overhead"],
    security: "Depends on transport layer security (TLS/SSL) and authentication implementation.",
    relatedProtocols: []
  };
}"""

prot_content = re.sub(prot_pattern, new_prot_func, prot_content, flags=re.DOTALL)

with open("packages/shared/src/protocol.ts", "w", encoding="utf-8") as f:
    f.write(prot_content)

print("Updated functions via regex.")
