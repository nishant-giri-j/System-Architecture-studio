import re

with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

bad = """            if (data.decision === 'CONCLUDE' || forceConclusion) {
                setConclusion(data.analysis || 'The AI concluded the experiment.');
                setStatus('done');
            } else if (data.decision === 'PROPOSE_EXPERIMENTS' && data.plans) {
                setProposedPlans(data.plans);
                setStatus('waiting-for-selection');
            }"""

good = """            if (data.analysis) {
                setConclusion(data.analysis);
            }
            if (data.decision === 'CONCLUDE' || forceConclusion) {
                if (!data.analysis) setConclusion('The AI concluded the experiment.');
                setStatus('done');
            } else if (data.decision === 'PROPOSE_EXPERIMENTS' && data.plans) {
                setProposedPlans(data.plans);
                setStatus('waiting-for-selection');
            }"""

code = code.replace(bad, good)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
