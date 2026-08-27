with open("packages/shared/src/technology-info.ts", "r", encoding="utf-8") as f:
    content = f.read()

import_statement = 'import { generatedTechData } from "./tech-data";\n'

find_func = """export function getTechnologyInfo(id: string, category: string, label: string): TechnologyInfo {
  const found = curatedTechnologyInfo[id];
  if (found) return found;

  return {
    overview: `${label} is a component typically used for ${category.toLowerCase()} architecture.`,
    howItWorks: `It processes data or requests according to standard ${category.toLowerCase()} patterns.`,
    useCases: [
      `Standard ${category.toLowerCase()} workloads`,
      "System integration",
      "Enterprise architecture"
    ],
    advantages: [
      "Industry standard implementation",
      "Flexible configuration"
    ],
    disadvantages: [
      "Requires operational overhead",
      "May require specialized knowledge"
    ],
    performance: "Performance depends on hardware allocation and specific workload characteristics.",
    security: "Implement standard security practices, including network isolation and least-privilege access.",
    alternatives: ["Alternative solutions depend on specific architectural requirements"]
  };
}"""

replace_func = """export function getTechnologyInfo(id: string, category: string, label: string): TechnologyInfo {
  const found = curatedTechnologyInfo[id];
  if (found) return found;

  if (generatedTechData[id]) {
    return generatedTechData[id];
  }

  return {
    overview: `${label} is a component typically used for ${category.toLowerCase()} architecture.`,
    howItWorks: `It processes data or requests according to standard ${category.toLowerCase()} patterns.`,
    useCases: [
      `Standard ${category.toLowerCase()} workloads`,
      "System integration",
      "Enterprise architecture"
    ],
    advantages: [
      "Industry standard implementation",
      "Flexible configuration"
    ],
    disadvantages: [
      "Requires operational overhead",
      "May require specialized knowledge"
    ],
    performance: "Performance depends on hardware allocation and specific workload characteristics.",
    security: "Implement standard security practices, including network isolation and least-privilege access.",
    alternatives: ["Alternative solutions depend on specific architectural requirements"]
  };
}"""

content = import_statement + content.replace(find_func, replace_func)

with open("packages/shared/src/technology-info.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated technology-info.ts")
