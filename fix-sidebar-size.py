import re

with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace the giant "Select Your Next Move" block
old_select_move = """                                <div className="bg-[#5de2e7] border-[3px] border-[#161616] p-3 text-center font-black uppercase text-[#161616] shadow-[4px_4px_0_#161616] animate-pulse">
                                    Select Your Next Move
                                </div>"""

new_select_move = """                                <div className="bg-[#5de2e7] border-[3px] border-[#161616] p-2 text-center text-xs font-black uppercase text-[#161616] shadow-[4px_4px_0_#161616] animate-pulse">
                                    Select Next Move
                                </div>"""
code = code.replace(old_select_move, new_select_move)

# Replace the giant card block
pattern = re.compile(r"className=\"group border-\[3px\] border-\[\#161616\] bg-\[\#fffdf5\].*?</div>\s*</div>\s*<p className=\"text-sm font-semibold italic text-neutral-700.*?p.hypothesis}.*?</p>\s*</div>", re.DOTALL)

new_card = """className="group border-[3px] border-[#161616] bg-[#fffdf5] p-3 cursor-pointer hover:bg-[#ffde59] hover:-translate-y-1 hover:shadow-[4px_4px_0_#161616] transition-all flex flex-col gap-2"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="font-black uppercase text-xs text-[#161616] leading-tight">{p.title || `Option ${idx + 1}`}</h4>
                                            <div className="bg-[#161616] text-white px-1.5 py-0.5 text-[9px] font-black uppercase shrink-0">
                                                Opt {idx + 1}
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col gap-1 mt-1">
                                            <span className="bg-[#161616] text-[#ffde59] px-1.5 py-0.5 text-[9px] font-black uppercase inline-block self-start">
                                                TARGET: {nodes.find(n => n.id === p.targetNodeId)?.data.label || p.targetNodeId}
                                            </span>
                                            <span className="bg-[#161616] text-[#5de2e7] px-1.5 py-0.5 text-[9px] font-black uppercase inline-block self-start">
                                                FIELD: {p.targetField}
                                            </span>
                                        </div>
                                        
                                        <div className="text-[10px] font-semibold italic text-neutral-700 border-l-[2px] border-[#161616] pl-2 mt-1 leading-tight group-hover:border-white transition-colors">
                                            "{p.hypothesis}"
                                        </div>
                                    </div>"""

code = pattern.sub(new_card, code)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
