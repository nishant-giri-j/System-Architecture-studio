import re

with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Remove the left-sidebar card block
left_block_pattern = r"                        \{status === 'waiting-for-selection' && proposedPlans\.length > 0 && \(\s*<div className=\"mt-6 flex flex-col gap-4\">\s*<div className=\"bg-\[\#5de2e7\].*?</div>\s*\{proposedPlans\.map\(\(p, idx\) => \(.*?\)\)\}\s*</div>\s*\)\}"
code = re.sub(left_block_pattern, "", code, flags=re.DOTALL)

# 2. Replace the right-panel cyan message with the big option cards
right_block_pattern = r"                        \{status === 'waiting-for-selection' && \(\s*<div className=\"border-\[3px\] border-\[\#161616\] bg-\[\#5de2e7\].*?</div>\s*\)\}"

new_right_block = """                        {status === 'waiting-for-selection' && (
                            <div className="border-[3px] border-[#161616] p-6 shadow-[4px_4px_0_#161616] bg-white flex flex-col mb-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles size={24} className="text-[#ff4fa3]" strokeWidth={3} />
                                    <h3 className="font-black text-xl uppercase text-[#161616]">Select Next Experiment</h3>
                                </div>
                                <p className="font-bold text-sm mb-6 text-[#161616]">
                                    The AI has analyzed the results and proposes the following distinct tests. Choose one to execute:
                                </p>
                                <div className="grid grid-cols-1 gap-4 mb-6">
                                    {proposedPlans.map((p, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => {
                                                setPlan(p);
                                                setResults([]);
                                                setCurrentStep(0);
                                                
                                                const target = nodes.find(n => n.id === p.targetNodeId);
                                                if (target) {
                                                    originalNodeState.current = { id: target.id, data: JSON.parse(JSON.stringify(target.data)) };
                                                }
                                                originalLimits.current = { maxInFlight, totalLimit, playbackSpeed, requestsPerSecond };
                                                
                                                if (p.playbackSpeed) setPlaybackSpeed(p.playbackSpeed);
                                                if (p.requestsPerSecond) setRequestsPerSecond(p.requestsPerSecond);
                                                if (onFitView) onFitView();
                                                
                                                setStatus('running');
                                                setIsPlaying(true);
                                            }}
                                            className="border-[3px] border-[#161616] bg-[#fffdf5] p-4 cursor-pointer hover:bg-[#ffde59] hover:-translate-y-1 hover:shadow-[4px_4px_0_#161616] transition-all flex flex-col gap-2"
                                        >
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-black uppercase text-[#161616]">{p.title || `Option ${idx + 1}`}</h4>
                                                <span className="bg-[#161616] text-white px-2 py-1 text-xs font-black uppercase">Option {idx + 1}</span>
                                            </div>
                                            <div className="text-xs font-bold text-neutral-600">TARGET: {nodes.find(n => n.id === p.targetNodeId)?.data.label || p.targetNodeId} &mdash; FIELD: {p.targetField}</div>
                                            <div className="text-sm font-semibold italic text-neutral-800">"{p.hypothesis}"</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-end pt-4 border-t-[3px] border-[#161616]">
                                    <button 
                                        onClick={() => {
                                            setStatus('agent-thinking');
                                            callChaosAgent(history, true);
                                        }}
                                        className="neo-button bg-[#ff6b6b] text-white hover:bg-[#e05656] font-black uppercase text-sm px-6 py-2"
                                    >
                                        Conclude & Generate Report
                                    </button>
                                </div>
                            </div>
                        )}"""

code = re.sub(right_block_pattern, new_right_block, code, flags=re.DOTALL)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
