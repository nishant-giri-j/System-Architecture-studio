import re

with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

paused_block = '''
                        {status === 'paused-asking-user' && (
                            <div className="border-[3px] border-[#161616] p-6 shadow-[4px_4px_0_#161616] bg-white flex flex-col items-center justify-center mb-6">
                                <Sparkles size={32} className="text-[#ff4fa3] mb-4" />
                                <h3 className="font-black text-xl uppercase mb-2 text-[#161616]">Continue Experiments?</h3>
                                <p className="font-bold text-sm text-center mb-6 max-w-md text-[#161616]">
                                    The AI has run {history.length} experiments and is still searching for a definitive conclusion. Would you like it to continue with 3 more attempts?
                                </p>
                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => {
                                            setAttemptCount(0);
                                            setStatus('agent-thinking');
                                            callChaosAgent(history, false);
                                        }}
                                        className="neo-button bg-[#5de2e7] hover:bg-[#4bcad0] font-black uppercase text-sm px-6 py-2"
                                    >
                                        Yes, Continue
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setStatus('agent-thinking');
                                            callChaosAgent(history, true);
                                        }}
                                        className="neo-button bg-[#ffde59] hover:bg-[#e6c84f] font-black uppercase text-sm px-6 py-2"
                                    >
                                        No, Conclude Now
                                    </button>
                                </div>
                            </div>
                        )}
'''

code = code.replace(
    '''<div className="flex-1 flex flex-col p-6 bg-[#fffdf5] overflow-y-auto relative">''',
    '''<div className="flex-1 flex flex-col p-6 bg-[#fffdf5] overflow-y-auto relative">''' + paused_block
)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
