with open('temp-modal.txt', 'rb') as f:
    raw = f.read()
try:
    code = raw.decode('utf-8')
except:
    code = raw.decode('utf-16')

# Start fresh!
old_chart = """                                {/* All Historical and Current Charts */}
                                <div className="mb-6 flex flex-col gap-12 shrink-0 w-full">
                                    {[...history, ...(status === 'running' && results.length > 0 ? [{ plan: plan!, results }] : [])].map((item, index) => ("""

new_chart = """                                {/* All Historical and Current Charts */}
                                <div className="mb-6 flex flex-col gap-12 shrink-0 w-full">
                                    {/* history moved to memo */}"""

# We just want to extract the textarea out so it doesn't re-render ExperimentModal
# Actually, the simplest fix is to wrap the textarea in a separate component: PromptInput!

# Wait, the error is inside `ExperimentModal`, if we just extract `PromptInput`, we don't need to touch `HistoryCharts` or ANY of the other JSX!
# Let's extract `PromptInput` and put it at the top of the file!

top_insert = """
const PromptInput = ({ initialPrompt, onSubmit, disabled }: any) => {
    const [local, setLocal] = useState(initialPrompt);
    
    useEffect(() => {
        setLocal(initialPrompt);
    }, [initialPrompt]);

    return (
        <div className="flex flex-col">
            <textarea
                className="mt-2 w-full resize-none border-[3px] border-[#161616] bg-[#fffdf5] p-3 text-sm font-semibold outline-none focus:bg-[#ffde59] transition-colors"
                rows={5}
                placeholder="e.g., 'What happens if we slowly drop the cache hit rate on the Redis node?' or 'Increase the processing delay on API Gateway by 50ms gaps.'"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                disabled={disabled}
            />
            
            <div className="flex flex-wrap gap-2 mt-4 mb-6">
                {['E-commerce platform with microservices', 'Real-time chat app with WebSocket', 'ML inference pipeline with GPU workers'].map(ex => (
                    <button 
                        key={ex}
                        onClick={() => setLocal(ex)}
                        className="bg-[#161616] text-[#fffdf5] px-3 py-1.5 text-xs font-black uppercase hover:-translate-y-0.5 hover:bg-[#ff4fa3] transition-all shadow-[2px_2px_0_#ffde59]"
                        disabled={disabled}
                    >
                        {ex}
                    </button>
                ))}
            </div>

            <button 
                onClick={() => onSubmit(local)}
                disabled={disabled || !local}
                className="neo-button w-full bg-[#ff4fa3] text-white border-[3px] border-[#161616] py-3 text-sm font-black uppercase tracking-wider shadow-[4px_4px_0_#161616] hover:-translate-y-1 hover:shadow-[6px_6px_0_#161616] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_#161616] flex items-center justify-center gap-2"
            >
                {disabled ? <Loader2 size={18} strokeWidth={3} className="animate-spin" /> : <Play size={18} strokeWidth={3} />}
                Generate & Run
            </button>
        </div>
    );
};
"""

code = code.replace("export function ExperimentModal", top_insert + "\nexport function ExperimentModal")

old_textarea = """                            <textarea
                                className="mt-2 w-full resize-none border-[3px] border-[#161616] bg-[#fffdf5] p-3 text-sm font-semibold outline-none focus:bg-[#ffde59] transition-colors"
                                rows={5}
                                placeholder="e.g., 'What happens if we slowly drop the cache hit rate on the Redis node?' or 'Increase the processing delay on API Gateway by 50ms gaps.'"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                disabled={status !== 'idle' && status !== 'done'}
                            />
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-6">
                            {['E-commerce platform with microservices', 'Real-time chat app with WebSocket', 'ML inference pipeline with GPU workers'].map(ex => (
                                <button 
                                    key={ex}
                                    onClick={() => setPrompt(ex)}
                                    className="bg-[#161616] text-[#fffdf5] px-3 py-1.5 text-xs font-black uppercase hover:-translate-y-0.5 hover:bg-[#ff4fa3] transition-all shadow-[2px_2px_0_#ffde59]"
                                    disabled={status !== 'idle' && status !== 'done'}
                                >
                                    {ex}
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={handleStartChaosAgent}
                            disabled={status !== 'idle' && status !== 'done' || !prompt}
                            className="neo-button w-full bg-[#ff4fa3] text-white border-[3px] border-[#161616] py-3 text-sm font-black uppercase tracking-wider shadow-[4px_4px_0_#161616] hover:-translate-y-1 hover:shadow-[6px_6px_0_#161616] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_#161616] flex items-center justify-center gap-2"
                        >
                            {(status !== 'idle' && status !== 'done') ? <Loader2 size={18} strokeWidth={3} className="animate-spin" /> : <Play size={18} strokeWidth={3} />}
                            Generate & Run
                        </button>"""

new_prompt_input = """                            <PromptInput 
                                initialPrompt={prompt} 
                                onSubmit={(val: string) => { setPrompt(val); handleStartChaosAgent(); }} 
                                disabled={status !== 'idle' && status !== 'done'} 
                            />"""
code = code.replace(old_textarea, new_prompt_input)

# Wait, handleStartChaosAgent checks if (!prompt) return!
# Because setPrompt is async, it might not be set when handleStartChaosAgent runs!
# So we must modify handleStartChaosAgent to take an optional prompt override:

old_handle = """    const handleStartChaosAgent = async () => {
        if (!prompt) return;"""
new_handle = """    const handleStartChaosAgent = async (overridePrompt?: string) => {
        const p = overridePrompt || prompt;
        if (!p) return;"""
code = code.replace(old_handle, new_handle)

# And inside handleStartChaosAgent, change `prompt` to `p`:
old_body = """                body: JSON.stringify({
                    prompt,"""
new_body = """                body: JSON.stringify({
                    prompt: p,"""
code = code.replace(old_body, new_body)

# And in PromptInput invocation:
new_prompt_input2 = """                            <PromptInput 
                                initialPrompt={prompt} 
                                onSubmit={(val: string) => { setPrompt(val); handleStartChaosAgent(val); }} 
                                disabled={status !== 'idle' && status !== 'done'} 
                            />"""
code = code.replace(new_prompt_input, new_prompt_input2)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("Done recreating from pristine backup!")
