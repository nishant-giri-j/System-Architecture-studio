with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if "status === 'paused-asking-user'" in line:
        start_idx = i
    if "No, Conclude Now" in line:
        end_idx = i + 5
        break

new_ui_waiting = """                        {status === 'waiting-for-selection' && (
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
                        )}\n"""

if start_idx != -1 and end_idx != -1:
    new_lines = lines[:start_idx] + [new_ui_waiting] + lines[end_idx:]
    with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("Done")
else:
    print("Not found")
