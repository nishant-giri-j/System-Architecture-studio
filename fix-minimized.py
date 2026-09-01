import re
with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

bad = """                            <div className="text-sm font-bold truncate text-[#161616]">Target: <span className="text-neutral-500">{plan?.targetNodeId}</span></div>
                            <div className="text-sm font-bold truncate text-[#161616]">Field: <span className="text-[#5de2e7]">{plan?.targetField}</span></div>
                            <div className="text-sm font-black text-[#ff4fa3]">Value: {plan?.steps[currentStep]}</div>"""
good = """                            <div className="text-xs font-bold text-[#161616] max-h-24 overflow-y-auto">
                                {plan?.mutations && plan.mutations.map((m, mIdx) => (
                                    <div key={mIdx}>
                                        <span className="text-neutral-500">[{m.action}] {m.targetId} {m.targetField}</span>
                                        <span className="text-[#ff4fa3] ml-2">Value: {JSON.stringify(m.values[currentStep])}</span>
                                    </div>
                                ))}
                            </div>"""

code = code.replace(bad, good)
with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
