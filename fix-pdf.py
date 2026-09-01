import re

with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

bad = """                <h3 class="text-2xl font-black mb-2">Target: \\${h.plan.targetNodeId} | Field: \\${h.plan.targetField}</h3>

                <p class="text-lg italic font-semibold mb-8 border-l-4 border-[#161616] pl-4 text-neutral-600">"\\${h.plan.hypothesis}"</p>"""

good = """                <h3 class="text-2xl font-black mb-2">\\${h.plan.title || 'Structural Test'}</h3>
                <h4 class="text-lg font-bold mb-4 text-neutral-700">\\${h.plan.mutations ? h.plan.mutations.map(m => \`[\\${m.action}] \\${m.targetId} \\${m.targetField ? '(' + m.targetField + ')' : ''}\`).join(' | ') : 'Target: ' + h.plan.targetNodeId + ' | Field: ' + h.plan.targetField}</h4>

                <p class="text-lg italic font-semibold mb-8 border-l-4 border-[#161616] pl-4 text-neutral-600">"\\${h.plan.hypothesis}"</p>"""

code = code.replace(bad, good)

# Also fix the chart labels! 
# The labels were: `const labels = h.results.map(r => r.value.toString());`
# Because value is now JSON.stringify of arrays, it might be huge for charts.
# Let's change it to just `Step ${r.stepIndex + 1}` to keep the chart axes clean!
code = code.replace("const labels = h.results.map(r => r.value.toString());", "const labels = h.results.map(r => 'Step ' + (r.stepIndex + 1));")

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
