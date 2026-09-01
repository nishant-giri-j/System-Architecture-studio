import re

with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Make decision checking case-insensitive and robust
old_conclude = "if (data.decision === 'CONCLUDE' || forceConclusion) {"
new_conclude = "const decisionStr = (data.decision || '').toUpperCase();\n            if (decisionStr.includes('CONCLUDE') || forceConclusion) {"

old_propose = "} else if (data.decision === 'PROPOSE_EXPERIMENTS' && data.plans) {"
new_propose = "} else if (decisionStr.includes('PROPOSE') && data.plans) {"

code = code.replace(old_conclude, new_conclude)
code = code.replace(old_propose, new_propose)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
