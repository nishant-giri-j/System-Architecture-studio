import re
with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix interface duplicates
code = re.sub(r"    edges: any\[\];\n    setEdges: \(edges: any\[\]\) => void;\n    edges: any\[\];\n    setEdges: \(edges: any\[\]\) => void;", r"    edges: any[];\n    setEdges: (edges: any[]) => void;", code)
# Fix destructuring duplicates
code = re.sub(r"    edges,\n    setEdges,\n    edges,\n    setEdges,", r"    edges,\n    setEdges,", code)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
