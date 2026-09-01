import re

with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

props_pattern = re.compile(r"interface ExperimentModalProps \{.*?\s+nodes: Node<ArchitectureNodeData>\[\];\n\s+setNodes: \(nodes: Node<ArchitectureNodeData>\[\]\) => void;", re.DOTALL)

def replacer(match):
    return match.group(0) + "\n    edges: any[];\n    setEdges: (edges: any[]) => void;"

code = props_pattern.sub(replacer, code)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
