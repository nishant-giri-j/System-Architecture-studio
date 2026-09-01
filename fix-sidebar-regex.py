import re

with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

pattern = r"\{plan && \(\s*<div className=\"mt-6 flex-1 overflow-y-auto border-\[3px\] border-\[\#161616\] bg-\[\#fffdf5\] p-4\">\s*<h3 className=\"mb-2 text-xs font-black uppercase\">Test Plan</h3>.*?</div>\s*</div>\s*\)\}"

new_ui = """{(history.length > 0 || (plan && status === 'running')) && (
                            <div className="mt-6 flex-1 overflow-y-auto border-[3px] border-[#161616] bg-[#fffdf5] p-4 flex flex-col gap-6">
                                <h3 className="text-xs font-black uppercase">Test Plan History</h3>
                                {[...history.map(h => h.plan), ...(plan && status === 'running' ? [plan] : [])].map((p, idx) => (
                                    <div key={idx} className="space-y-3 pb-6 border-b-[2px] border-dashed border-neutral-300 last:border-b-0 last:pb-0">
                                        <div className="text-xs font-black uppercase text-[#161616]">Experiment {idx + 1}</div>
                                        <div className="bg-[#161616] text-[#ffde59] p-2 text-xs font-bold">
                                            TARGET: {nodes.find(n => n.id === p.targetNodeId)?.data.label || p.targetNodeId}
                                        </div>
                                        <div className="bg-[#161616] text-[#5de2e7] p-2 text-xs font-bold break-all">
                                            FIELD: {p.targetField}
                                        </div>
                                        <div className="bg-[#161616] text-[#ff4fa3] p-2 text-xs font-bold">
                                            STEPS: {p.steps.join(' \u2192 ')}
                                        </div>
                                        <div className="text-xs font-semibold italic text-neutral-600 border-l-[3px] border-[#161616] pl-2 mt-4">
                                            "{p.hypothesis}"
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}"""

code = re.sub(pattern, new_ui, code, flags=re.DOTALL)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
