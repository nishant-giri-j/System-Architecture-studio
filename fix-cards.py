import re

with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

old_ui = """                                    {proposedPlans.map((p, idx) => (
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
                                            className="border-[3px] border-[#161616] bg-[#fffdf5] p-4 cursor-pointer hover:bg-[#ffde59] hover:-translate-y-1 hover:shadow-[4px_4px_0_#161616] transition-all"
                                        >
                                            <h4 className="font-black uppercase text-[#161616] mb-2">{p.title || `Option ${idx + 1}`}</h4>
                                            <div className="text-xs font-bold text-neutral-600 mb-2">TARGET: {nodes.find(n => n.id === p.targetNodeId)?.data.label || p.targetNodeId} &mdash; FIELD: {p.targetField}</div>
                                            <div className="text-xs font-semibold italic text-neutral-600">"{p.hypothesis}"</div>
                                        </div>
                                    ))}"""

new_ui = """                                    {proposedPlans.map((p, idx) => (
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
                                            className="group border-[3px] border-[#161616] bg-[#fffdf5] p-5 cursor-pointer hover:bg-[#ffde59] hover:-translate-y-1 hover:shadow-[6px_6px_0_#161616] transition-all flex flex-col gap-3"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <h4 className="font-black uppercase text-lg text-[#161616] leading-tight">{p.title || `Option ${idx + 1}`}</h4>
                                                <div className="bg-[#161616] text-white px-2 py-1 text-[10px] font-black uppercase shrink-0">
                                                    Option {idx + 1}
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-2">
                                                <span className="bg-[#161616] text-[#ffde59] px-2 py-1 text-[10px] font-black uppercase">
                                                    TARGET: {nodes.find(n => n.id === p.targetNodeId)?.data.label || p.targetNodeId}
                                                </span>
                                                <span className="bg-[#161616] text-[#5de2e7] px-2 py-1 text-[10px] font-black uppercase">
                                                    FIELD: {p.targetField}
                                                </span>
                                            </div>
                                            
                                            <p className="text-sm font-semibold italic text-neutral-700 border-l-[3px] border-[#161616] pl-3 mt-1 group-hover:border-white transition-colors">
                                                "{p.hypothesis}"
                                            </p>
                                        </div>
                                    ))}"""

code = code.replace(old_ui, new_ui)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
