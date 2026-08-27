import re

with open('apps/web/hooks/use-simulation.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Insert executeLogic wrapping around the body of handleArrival
start_marker = "            const outgoingEdges = edgesRef.current.filter((e) => e.source === arrivedAtId);"
end_marker = "        },\n        [emitPulse, addLog, createPausableTimeout]\n    );"

# Find the start of handleArrival's main body
pre_handle = content.split(start_marker)[0]
post_handle = start_marker + content.split(start_marker)[1]

inner_body = post_handle.split(end_marker)[0]
after_end = end_marker + post_handle.split(end_marker)[1]

new_inner = f"""
            const delay = node.data.processingDelay || 0;

            if (delay >= 1000 && pulse.type === 'request') {{
                setBottleneckNodes(prev => {{
                    if (!prev.has(node.id)) {{
                        const next = new Set(prev);
                        next.add(node.id);
                        return next;
                    }}
                    return prev;
                }});
            }} else {{
                setBottleneckNodes(prev => {{
                    if (prev.has(node.id)) {{
                        const next = new Set(prev);
                        next.delete(node.id);
                        return next;
                    }}
                    return prev;
                }});
            }}

            const executeLogic = () => {{
                if (!isPlayingRef.current) return;
{inner_body}
            }};

            if (delay > 0 && pulse.type === 'request') {{
                createPausableTimeout(executeLogic, delay);
            }} else {{
                executeLogic();
            }}
"""

with open('apps/web/hooks/use-simulation.ts', 'w', encoding='utf-8') as f:
    f.write(pre_handle + new_inner + after_end)

print("Updated useSimulation.ts")
