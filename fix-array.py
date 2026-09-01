with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace(
    "{[...history, ...(results.length > 0 ? [{ plan: plan!, results }] : [])].map((item, index) => (",
    "{[...history, ...(status === 'running' && results.length > 0 ? [{ plan: plan!, results }] : [])].map((item, index) => ("
)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
