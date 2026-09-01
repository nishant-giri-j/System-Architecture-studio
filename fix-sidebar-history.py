import re
with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

bad = """                                        <div className="bg-[#161616] text-[#ffde59] p-2 text-xs font-bold">
                                            TARGET: {nodes.find(n => n.id === p.targetNodeId)?.data.label || p.targetNodeId}
                                        </div>
                                        <div className="bg-[#161616] text-[#5de2e7] p-2 text-xs font-bold break-all">
                                            FIELD: {p.targetField}
                                        </div>
                                        <div className="bg-[#161616] text-[#ff4fa3] p-2 text-xs font-bold">
                                            STEPS: {p.steps.join(' \\u2192 ')}
                                        </div>"""
good = """                                        <div className="bg-[#161616] text-[#ffde59] p-2 text-[10px] font-bold font-mono">
                                            {p.mutations && p.mutations.map((m, mIdx) => (
                                                <div key={mIdx} className="mb-1 last:mb-0">
                                                    [{m.action}] {m.targetId} {m.targetField ? `(${m.targetField})` : ''}
                                                    <div className="text-[#5de2e7] ml-2">VALUES: {m.values.join(' \\u2192 ')}</div>
                                                </div>
                                            ))}
                                        </div>"""

code = code.replace(bad, good)
with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
