with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace("    return (\n        <div className={\ixed inset-0", "    if (!isOpen) return null;\n\n    return (\n        <div className={\ixed inset-0")

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
