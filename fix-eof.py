with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(len(lines)-1, -1, -1):
    if ")} " in lines[i] or ")}" in lines[i]:
        if i > len(lines) - 15:
            lines[i] = ""

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
