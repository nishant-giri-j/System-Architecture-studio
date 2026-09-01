with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

call_chaos_agent = """    const callChaosAgent = async (currentHistory: any[], forceConclusion: boolean = false) => {
        try {
            const res = await fetch('/api/ai/chaos-agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    nodes: nodes.map(n => ({ id: n.id, data: n.data })),
                    history: currentHistory,
                    forceConclusion
                }),
                signal: abortControllerRef.current?.signal
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            if (data.decision === 'CONCLUDE' || forceConclusion) {
                setConclusion(data.analysis || 'The AI concluded the experiment.');
                setStatus('done');
            } else if (data.decision === 'PROPOSE_EXPERIMENTS' && data.plans) {
                setProposedPlans(data.plans);
                setStatus('waiting-for-selection');
            }
        } catch (e: any) {
            if (e.name !== 'AbortError') {
                setError(e.message || "Failed to contact Chaos Agent.");
                setStatus('idle');
            }
        }
    };

"""

code = code.replace("    const handleStartChaosAgent = async () => {", call_chaos_agent + "    const handleStartChaosAgent = async () => {")

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
