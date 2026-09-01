import re

with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

pattern = re.compile(r"export function ExperimentModal\(\{\s+isOpen,\s+onClose,\s+nodes,\s+setNodes,", re.DOTALL)
new_destruct = "export function ExperimentModal({\n    isOpen,\n    onClose,\n    nodes,\n    setNodes,\n    edges,\n    setEdges,"

code = pattern.sub(new_destruct, code)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
