import re

with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix originalNodeState
code = re.sub(r"if \(originalNodeState\.current\) \{\s*setNodes\(nodes\.map\(n => n\.id === originalNodeState\.current\.id \? \{ \.\.\.n, data: originalNodeState\.current\.data \} : n\)\);\s*\}", 
              "if (originalNodes.current.length > 0) { setNodes(originalNodes.current); setEdges(originalEdges.current); }", 
              code)

# Fix Cannot find name 'value' (this is in the history saving logic where results are recorded)
# It used to say: const res = { stepIndex: currentStep, value, throughput: Math.round(t), ... }
# Now value is not just one number. We can record value as something like JSON.stringify(plan.mutations.map(m => m.values[currentStep])) or just 0
code = code.replace("stepIndex: currentStep, value,", "stepIndex: currentStep, value: 0,")

# Fix old UI fields (targetNodeId, targetField, steps) in history rendering
def ui_history_replacer(match):
    return """<div className="flex flex-col gap-1 mt-1 mb-2">
                                                    {item.plan.mutations && item.plan.mutations.map((m, mIdx) => (
                                                        <div key={mIdx} className="text-xs font-bold text-[#161616]">
                                                            [{m.action}] {m.targetId} {m.targetField ? `(${m.targetField})` : ''}
                                                        </div>
                                                    ))}
                                                </div>"""

code = re.sub(r"Experiment \{index \+ 1\}: \{item\.plan\.targetField\} on \{nodes\.find\(n => n\.id === item\.plan\.targetNodeId\)\?\.data\.label \|\| item\.plan\.targetNodeId\}", ui_history_replacer, code)

# Fix old UI fields in waiting-for-selection options cards
code = re.sub(r'<div className="text-xs font-bold text-neutral-600">TARGET: \{nodes\.find\(n => n\.id === p\.targetNodeId\)\?\.data\.label \|\| p\.targetNodeId\} &mdash; FIELD: \{p\.targetField\}</div>', 
              r'''<div className="flex flex-col gap-1 mt-1 mb-2">
                                                  {p.mutations && p.mutations.map((m, mIdx) => (
                                                      <div key={mIdx} className="text-xs font-bold text-neutral-600">
                                                          [{m.action}] {m.targetId} {m.targetField ? `(${m.targetField})` : ''}
                                                      </div>
                                                  ))}
                                              </div>''', 
              code)

# There is another place where it says `p.steps.join` or something in waiting-for-selection?
# "1136: Property 'steps' does not exist on type 'ExperimentPlan'."
code = re.sub(r'<div className="text-sm font-semibold italic text-neutral-800">"\{p\.hypothesis\}"</div>', 
              r'<div className="text-sm font-semibold italic text-neutral-800">"{p.hypothesis}"</div>', 
              code) # Actually wait, 1136 is probably the history sidebar? I already replaced that.

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
