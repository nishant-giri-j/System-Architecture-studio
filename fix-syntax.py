with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "Error: {error}" in line:
        lines[i+1] = '                            </div>\n                        )}\n\n'
        break

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
