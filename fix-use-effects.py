with open('apps/web/components/canvas/architecture-canvas.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

old_set_nodes = """    // Apply bottleneck styles
    useEffect(() => {
        setNodes((nds) =>
            nds.map((n) => {
                const isBottleneck = bottleneckNodes.has(n.id);
                const glowClass = isBottleneck ? ' bottleneck-glow' : '';
                const baseClass =
                    n.className?.replace(' bottleneck-glow', '') || '';
                return { ...n, className: baseClass + glowClass };
            }),
        );
    }, [bottleneckNodes, setNodes]);"""

new_set_nodes = """    // Apply bottleneck styles
    useEffect(() => {
        setNodes((nds) => {
            let changed = false;
            const next = nds.map((n) => {
                const isBottleneck = bottleneckNodes.has(n.id);
                const glowClass = isBottleneck ? ' bottleneck-glow' : '';
                const baseClass = n.className?.replace(' bottleneck-glow', '') || '';
                const targetClassName = (baseClass + glowClass).trim();
                
                if (n.className === targetClassName) return n;
                changed = true;
                return { ...n, className: targetClassName };
            });
            return changed ? next : nds;
        });
    }, [bottleneckNodes, setNodes]);"""

old_set_edges = """    useEffect(() => {
        setEdges((currentEdges) =>
            currentEdges.map((edge) => {
                const pulsesForEdge = edgePulses[edge.id] || [];
                return {
                    ...edge,
                    animated: isPlaying && !isPaused, // Keep pure CSS continuous animation too!
                    data: {
                        ...edge.data,
                        event: edge.data?.event ?? 'event',
                        pulses: pulsesForEdge,
                        isPaused,
                        playbackSpeed,
                    },
                };
            }),
        );
    }, [isPlaying, isPaused, edgePulses, setEdges]);"""

new_set_edges = """    useEffect(() => {
        setEdges((currentEdges) => {
            let changed = false;
            const next = currentEdges.map((edge) => {
                const pulsesForEdge = edgePulses[edge.id] || [];
                const shouldAnimate = isPlaying && !isPaused;
                
                if (
                    edge.animated === shouldAnimate &&
                    edge.data?.pulses === pulsesForEdge &&
                    edge.data?.isPaused === isPaused &&
                    edge.data?.playbackSpeed === playbackSpeed
                ) {
                    return edge;
                }
                
                changed = true;
                return {
                    ...edge,
                    animated: shouldAnimate,
                    data: {
                        ...edge.data,
                        event: edge.data?.event ?? 'event',
                        pulses: pulsesForEdge,
                        isPaused,
                        playbackSpeed,
                    },
                };
            });
            return changed ? next : currentEdges;
        });
    }, [isPlaying, isPaused, edgePulses, playbackSpeed, setEdges]);"""

code = code.replace(old_set_nodes, new_set_nodes)
code = code.replace(old_set_edges, new_set_edges)

with open('apps/web/components/canvas/architecture-canvas.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
