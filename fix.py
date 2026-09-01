with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "const conclusionHtml =" in line:
        # replace the lines manually
        lines[i+1] = "            .replace(/\\n\\n/g, '</p><p>')\n"
        lines[i+2] = "            .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')\n"
        
with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
