with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace("style={{ width: ${(results.length / (plan?.steps.length || 1)) * 100}% }}", "style={{ width: `${(results.length / (plan?.steps.length || 1)) * 100}%` }}")

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
