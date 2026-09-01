import re

with open('apps/web/components/canvas/architecture-canvas.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

pattern = re.compile(r"nodes=\{nodes as ArchitectureFlowNode\[\]\}\s+setNodes=\{setNodes as any\}", re.DOTALL)
new_props = "nodes={nodes as ArchitectureFlowNode[]}\n                    setNodes={setNodes as any}\n                    edges={edges}\n                    setEdges={setEdges}"

code = pattern.sub(new_props, code)

with open('apps/web/components/canvas/architecture-canvas.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
