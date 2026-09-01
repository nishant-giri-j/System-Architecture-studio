with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

bad = """        if (originalNodeState.current) {
            setNodes(nodes.map(n => n.id === originalNodeState.current.id ? { ...n, data: originalNodeState.current.data } : n));
        }"""
good = """        if (originalNodes.current.length > 0) {
            setNodes(originalNodes.current);
            setEdges(originalEdges.current);
        }"""
code = code.replace(bad, good)

bad2 = """            if (originalNodeState.current) {
                setNodes(nodes.map(n => n.id === originalNodeState.current.id ? { ...n, data: originalNodeState.current.data } : n));
            }"""
good2 = """            if (originalNodes.current.length > 0) {
                setNodes(originalNodes.current);
                setEdges(originalEdges.current);
            }"""
code = code.replace(bad2, good2)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
