import re

with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

old_block = """            if (data.decision === 'CONCLUDE' || forceConclusion) {
                setConclusion(data.analysis || 'The AI concluded the experiment.');
                setStatus('done');
            } else if (data.decision === 'RUN_EXPERIMENT' && data.plan) {
                setPlan(data.plan);
                setResults([]);
                setCurrentStep(0);
                
                const target = nodes.find(n => n.id === data.plan.targetNodeId);
                if (target) {
                    originalNodeState.current = { id: target.id, data: JSON.parse(JSON.stringify(target.data)) };
                }
                
                originalLimits.current = { maxInFlight, totalLimit, playbackSpeed, requestsPerSecond };
                
                if (data.plan.playbackSpeed) setPlaybackSpeed(data.plan.playbackSpeed);
                if (data.plan.requestsPerSecond) setRequestsPerSecond(data.plan.requestsPerSecond);
                
                if (onFitView) onFitView();
                
                setStatus('running');
                setIsPlaying(true);
            }"""

new_block = """            if (data.decision === 'CONCLUDE' || forceConclusion) {
                setConclusion(data.analysis || 'The AI concluded the experiment.');
                setStatus('done');
            } else if (data.decision === 'PROPOSE_EXPERIMENTS' && data.plans) {
                setProposedPlans(data.plans);
                setStatus('waiting-for-selection');
            }"""

# Since exact string replacement might fail due to whitespace, let's use regex
pattern = r"if \(data\.decision === 'CONCLUDE'.*?setIsPlaying\(true\);\s*\}"

code = re.sub(pattern, new_block, code, flags=re.DOTALL)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
