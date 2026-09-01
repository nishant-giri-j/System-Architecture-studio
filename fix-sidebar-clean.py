import re

with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

pattern = re.compile(r"\{\/\* Sidebar \/ Prompt \*\/\}.*?\{\/\* Main Content \(Charts \/ Report\) \*\/\}", re.DOTALL)

clean_sidebar = """{/* Sidebar / Prompt */}
                    <div className="w-1/3 border-r-[4px] border-[#161616] bg-white p-6 flex flex-col">
                        <div className="mb-4">
                            <label className="text-sm font-black uppercase text-[#161616]">What do you want to test?</label>
                            <textarea
                                className="mt-2 w-full resize-none border-[3px] border-[#161616] bg-[#fffdf5] p-3 text-sm font-semibold outline-none focus:bg-[#ffde59] transition-colors"
                                rows={5}
                                placeholder="e.g., 'What happens if we slowly drop the cache hit rate on the Redis node?' or 'Increase the processing delay on API Gateway by 50ms gaps.'"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                disabled={status !== 'idle' && status !== 'done'}
                            />
                        </div>
                        
                        <button
                            onClick={handleStartChaosAgent}
                            disabled={status !== 'idle' && status !== 'done'}
                            className="flex w-full items-center justify-center gap-2 border-[3px] border-[#161616] bg-[#9cf57a] px-4 py-3 font-black uppercase transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0_#161616] active:translate-y-0 active:shadow-none disabled:opacity-50"
                        >
                            <Sparkles size={20} strokeWidth={3} />
                            Generate & Run
                        </button>

                        {(status === 'agent-thinking') && (
                            <button
                                onClick={handleCancel}
                                className="mt-2 flex w-full items-center justify-center gap-2 border-[3px] border-[#161616] bg-[#ff6b6b] px-4 py-3 font-black uppercase text-white transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0_#161616] active:translate-y-0 active:shadow-none"
                            >
                                <X size={20} strokeWidth={3} />
                                Cancel
                            </button>
                        )}

                        {error && (
                            <div className="mt-4 border-[3px] border-[#161616] bg-[#ff6b6b] p-3 text-xs font-bold text-white">
                                Error: {error}
                            </div>
                        )}

                        {status === 'waiting-for-selection' && proposedPlans.length > 0 && (
                            <div className="mt-6 flex flex-col gap-4">
                                <div className="bg-[#5de2e7] border-[3px] border-[#161616] p-3 text-center font-black uppercase text-[#161616] shadow-[4px_4px_0_#161616] animate-pulse">
                                    Select Your Next Move
                                </div>
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
                                ))}
                            </div>
                        )}

                        {(history.length > 0 || (plan && status === 'running')) && (
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
                                            STEPS: {p.steps.join(' ? ')}
                                        </div>
                                        <div className="text-xs font-semibold italic text-neutral-600 border-l-[3px] border-[#161616] pl-2 mt-4">
                                            "{p.hypothesis}"
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Main Content (Charts / Report) */}"""

code = pattern.sub(clean_sidebar, code)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
