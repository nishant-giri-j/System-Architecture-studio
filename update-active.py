with open('apps/web/hooks/use-simulation.ts', 'r', encoding='utf-8') as f:
    content = f.read()

old_block = """            if (delay >= 1000 && pulse.type === 'request') {
                setBottleneckNodes(prev => {
                    if (!prev.has(node.id)) {
                        const next = new Set(prev);
                        next.add(node.id);
                        return next;
                    }
                    return prev;
                });
            } else {
                setBottleneckNodes(prev => {
                    if (prev.has(node.id)) {
                        const next = new Set(prev);
                        next.delete(node.id);
                        return next;
                    }
                    return prev;
                });
            }

            const executeLogic = () => {
                if (!isPlayingRef.current) return;"""

new_block = """            const executeLogic = () => {
                if (!isPlayingRef.current) return;"""

content = content.replace(old_block, new_block)

old_timeout = """            if (delay > 0 && pulse.type === 'request') {
                createPausableTimeout(executeLogic, delay);
            } else {
                executeLogic();
            }"""

new_timeout = """            if (delay > 0 && pulse.type === 'request') {
                if (delay >= 1000) {
                    setBottleneckNodes(prev => {
                        const next = new Set(prev);
                        next.add(node.id);
                        return next;
                    });
                }
                createPausableTimeout(() => {
                    if (delay >= 1000) {
                        setBottleneckNodes(prev => {
                            const next = new Set(prev);
                            next.delete(node.id);
                            return next;
                        });
                    }
                    executeLogic();
                }, delay);
            } else {
                executeLogic();
            }"""

content = content.replace(old_timeout, new_timeout)

with open('apps/web/hooks/use-simulation.ts', 'w', encoding='utf-8') as f:
    f.write(content)
