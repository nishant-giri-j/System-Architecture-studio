with open("packages/shared/src/protocol.ts", "r", encoding="utf-8") as f:
    content = f.read()

import_statement = 'import { generatedProtocolData } from "./protocol-data";\n'

# Find the getProtocolInfo function
find_func = """export function getProtocolInfo(id: string, name?: string): ProtocolDefinition {
  const found = protocolLibrary.find((p) => p.id === id);
  if (found) return found;

  return {
    id,
    label: name || id,
    category: "Custom",
    overview: `Detailed information about ${name || id} is currently unavailable.`,
    transport: "TCP / Unknown",
    communicationStyle: "Unknown",
    useCases: ["Custom integration", "Specialized communication"],
    advantages: ["Specific to architecture"],
    disadvantages: ["Requires custom implementation"],
    security: "Depends on implementation.",
    relatedProtocols: [],
  };
}"""

replace_func = """export function getProtocolInfo(id: string, name?: string): ProtocolDefinition {
  const found = protocolLibrary.find((p) => p.id === id);
  if (found) return found;
  
  if (generatedProtocolData[id]) {
    return {
      id,
      label: name || id,
      category: "Custom",
      ...generatedProtocolData[id]
    };
  }

  return {
    id,
    label: name || id,
    category: "Custom",
    overview: `Detailed information about ${name || id} is currently unavailable.`,
    transport: "TCP / Unknown",
    communicationStyle: "Unknown",
    useCases: ["Custom integration", "Specialized communication"],
    advantages: ["Specific to architecture"],
    disadvantages: ["Requires custom implementation"],
    security: "Depends on implementation.",
    relatedProtocols: [],
  };
}"""

content = import_statement + content.replace(find_func, replace_func)

with open("packages/shared/src/protocol.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated protocol.ts")
