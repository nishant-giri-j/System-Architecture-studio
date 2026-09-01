with open('apps/web/components/canvas/experiment-modal.tsx', 'rb') as f:
    raw = f.read()

try:
    code = raw.decode('utf-8')
except:
    code = raw.decode('utf-16')

# 1. Fix the top of HistoryCharts
bad_top = """    return (
        {/* All Historical and Current Charts */}
                                <div className="mb-6 flex flex-col gap-12 shrink-0 w-full">"""
good_top = """    return (
        <>
        {/* All Historical and Current Charts */}
                                <div className="mb-6 flex flex-col gap-12 shrink-0 w-full">"""
code = code.replace(bad_top, good_top)

# 2. Fix the bottom of HistoryCharts
bad_bot = """                                    ))}
                                </div>
    );
});"""
good_bot = """                                    ))}
                                </div>
        </>
    );
});"""
code = code.replace(bad_bot, good_bot)

# 3. Replace the corrupt invocation block
# We know the invocation was corrupted to:
# <div className="border-[3px] borde{/* All Historical and Current Charts */}
#                                 <HistoryCharts ... />
#                                              )}
bad_invocation = """                              <div className="border-[3px] borde{/* All Historical and Current Charts */}
                                <HistoryCharts 
                                    items={[...history, ...(status === 'running' && results.length > 0 ? [{ plan: plan!, results }] : [])]} 
                                    nodes={nodes} 
                                />
                                             )}"""
good_invocation = """                              <div className="border-[3px] border-[#161616] p-6 shadow-[4px_4px_0_#161616] bg-white flex flex-col mb-6">
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
                                              className="group border-[3px] border-[#161616] bg-[#fffdf5] p-5 cursor-pointer hover:bg-[#ffde59] hover:-translate-y-1 hover:shadow-[6px_6px_0_#161616] transition-all flex flex-col gap-3"
                                          >
                                              <div className="flex gap-2">
                                                  <span className="bg-[#161616] text-[#ffde59] px-2 py-1 text-xs font-black uppercase">TARGET: {nodes.find(n => n.id === p.targetNodeId)?.data.label || p.targetNodeId}</span>
                                                  <span className="bg-[#161616] text-[#5de2e7] px-2 py-1 text-xs font-black uppercase">FIELD: {p.targetField}</span>
                                              </div>
                                              <h4 className="font-black uppercase text-lg text-[#161616]">{p.title || `Experiment ${idx + 1}`}</h4>
                                              <p className="text-sm font-semibold italic text-neutral-700 border-l-[3px] border-[#161616] pl-3">
                                                  "{p.hypothesis}"
                                              </p>
                                          </div>
                                      ))}
                                  </div>
                                  <div className="flex items-center gap-4">
                                      <button 
                                          onClick={() => {
                                              setStatus('agent-thinking');
                                              callChaosAgent(history, true);
                                          }}
                                          className="neo-button flex-1 bg-white border-[3px] border-[#161616] py-3 text-sm font-black uppercase shadow-[4px_4px_0_#161616] hover:-translate-y-1 hover:shadow-[6px_6px_0_#161616]"
                                      >
                                          Conclude & Generate Report
                                      </button>
                                  </div>
                              </div>
                          )}

                          <HistoryCharts 
                              items={[...history, ...(status === 'running' && results.length > 0 ? [{ plan: plan!, results }] : [])]} 
                              nodes={nodes} 
                          />"""
code = code.replace(bad_invocation, good_invocation)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("Done fixing syntax")
