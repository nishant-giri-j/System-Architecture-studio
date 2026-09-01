with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

old_plan_ui = """                        {plan && (
                            <div className="mt-6 flex-1 overflow-y-auto border-[3px] border-[#161616] bg-[#fffdf5] p-4">
                                <h3 className="mb-2 text-xs font-black uppercase">Test Plan</h3>
                                <div className="space-y-3">
                                    <div className="bg-[#161616] text-[#ffde59] p-2 text-xs font-bold">
                                        TARGET: {nodes.find(n => n.id === plan.targetNodeId)?.data.label || plan.targetNodeId}
                                    </div>
                                    <div className="bg-[#161616] text-[#5de2e7] p-2 text-xs font-bold break-all">
                                        FIELD: {plan.targetField}
                                    </div>
                                    <div className="bg-[#161616] text-[#ff4fa3] p-2 text-xs font-bold">
                                        STEPS: {plan.steps.join(' \u2192 ')}
                                    </div>
                                    <div className="text-xs font-semibold italic text-neutral-600 border-l-[3px] border-[#161616] pl-2 mt-4">
                                        "{plan.hypothesis}"
                                    </div>
                                </div>
                            </div>
                        )}"""

# Note: The arrow symbol might have been mangled. Let's use regex or find exact string.
