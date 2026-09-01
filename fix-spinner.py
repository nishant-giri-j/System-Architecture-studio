with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace(
    "{status !== 'idle' && status !== 'agent-thinking' && (",
    "{status !== 'idle' && ("
)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
