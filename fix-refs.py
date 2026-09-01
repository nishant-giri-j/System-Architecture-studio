import re

with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix currentStep >= plan.steps.length
code = code.replace("currentStep >= plan.steps.length", "currentStep >= plan.stepCount")

# Fix originalNodeState manual replacements
bad = """            if (originalNodeState.current) {
                setNodes(nodes.map(n => n.id === originalNodeState.current.id ? { ...n, data: originalNodeState.current.data } : n));
            }"""
good = """            if (originalNodes.current.length > 0) {
                setNodes(originalNodes.current);
                setEdges(originalEdges.current);
            }"""
code = code.replace(bad, good)

bad2 = """        if (originalNodeState.current) {
            setNodes(nodes.map(n => n.id === originalNodeState.current.id ? { ...n, data: originalNodeState.current.data } : n));
        }"""
code = code.replace(bad2, good)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
