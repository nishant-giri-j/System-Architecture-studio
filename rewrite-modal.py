import re

with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Update types
code = code.replace("playbackSpeed?: number;", "playbackSpeed?: number;\n    title?: string;")

# State Machine
code = code.replace(
    "const [status, setStatus] = useState<'idle' | 'agent-thinking' | 'running' | 'paused-asking-user' | 'done'>('idle');",
    "const [status, setStatus] = useState<'idle' | 'agent-thinking' | 'waiting-for-selection' | 'running' | 'done'>('idle');"
)
code = code.replace(
    "const [plan, setPlan] = useState<ExperimentPlan | null>(null);",
    "const [plan, setPlan] = useState<ExperimentPlan | null>(null);\n    const [proposedPlans, setProposedPlans] = useState<ExperimentPlan[]>([]);"
)
code = code.replace("const [attemptCount, setAttemptCount] = useState(0);", "")

# Clear attemptCount logic
code = code.replace("setAttemptCount(0);\n", "")

# handleClear / handleStartChaosAgent
code = code.replace("setProposedPlans([]);\n", "")
code = code.replace("setPlan(null);", "setPlan(null);\n        setProposedPlans([]);")

# Simulation End Block (currentStep >= plan.steps.length)
old_sim_end = """            const newHistoryItem = { plan, results };
            const newHistory = [...history, newHistoryItem];
            setHistory(newHistory);

            const newAttemptCount = attemptCount + 1;
            setAttemptCount(newAttemptCount);

            if (newAttemptCount >= 3) {
                setStatus('paused-asking-user');
            } else {
                setStatus('agent-thinking');
                callChaosAgent(newHistory, false);
            }
            return;"""

new_sim_end = """            const newHistoryItem = { plan, results };
            const newHistory = [...history, newHistoryItem];
            setHistory(newHistory);
            
            setStatus('agent-thinking');
            callChaosAgent(newHistory, false);
            return;"""

code = code.replace(old_sim_end, new_sim_end)

# API Response Block
old_api_block = """            if (data.decision === 'CONCLUDE' || forceConclusion) {
                setConclusion(data.analysis || 'The AI concluded the experiment.');
                setStatus('done');
            } else if (data.decision === 'RUN_EXPERIMENT' && data.plan) {
                setPlan(data.plan);
                if (data.plan.playbackSpeed) setPlaybackSpeed(data.plan.playbackSpeed);
                if (data.plan.requestsPerSecond) setRequestsPerSecond(data.plan.requestsPerSecond);
                
                if (onFitView) onFitView();
                
                setStatus('running');
                setIsPlaying(true);
            }"""

new_api_block = """            if (data.decision === 'CONCLUDE' || forceConclusion) {
                setConclusion(data.analysis || 'The AI concluded the experiment.');
                setStatus('done');
            } else if (data.decision === 'PROPOSE_EXPERIMENTS' && data.plans) {
                setProposedPlans(data.plans);
                setStatus('waiting-for-selection');
            }"""

code = code.replace(old_api_block, new_api_block)

# UI Block - Add Waiting for Selection
old_ui_paused = """                        {status === 'paused-asking-user' && (
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
                        )}"""

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
                        )}"""

code = code.replace(old_ui_paused, new_ui_waiting)

# Also fix the "Attempt {attemptCount + 1}" since attemptCount is removed
code = code.replace(
    "Attempt {attemptCount + 1}: Step {currentStep + 1}",
    "Experiment {history.length + 1} &mdash; Step {currentStep + 1}"
)

# And fix the display in the Sidebar Test Plan when waiting-for-selection
code = code.replace(
    "disabled={!prompt.trim() || (status !== 'idle' && status !== 'done')}",
    "disabled={status !== 'idle' && status !== 'done'}"
)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
