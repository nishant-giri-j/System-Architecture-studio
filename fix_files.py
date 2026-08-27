with open("packages/shared/src/protocol.ts", "r", encoding="utf-8") as f:
    lines = f.readlines()
    
# Find where getProtocolInfo starts
start_idx = -1
for i, line in enumerate(lines):
    if line.startswith("export function getProtocolInfo("):
        start_idx = i
        break
        
if start_idx != -1:
    lines = lines[:start_idx]
    
new_func = """export function getProtocolInfo(id: string): ProtocolDefinition {
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
}
"""
lines.append(new_func)

with open("packages/shared/src/protocol.ts", "w", encoding="utf-8") as f:
    f.writelines(lines)


with open("packages/shared/src/technology-info.ts", "r", encoding="utf-8") as f:
    lines = f.readlines()
    
start_idx = -1
for i, line in enumerate(lines):
    if line.startswith("export function getTechnologyInfo("):
        start_idx = i
        break

if start_idx != -1:
    lines = lines[:start_idx]
    
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
}
"""
lines.append(new_tech_func)

with open("packages/shared/src/technology-info.ts", "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Files fixed.")
