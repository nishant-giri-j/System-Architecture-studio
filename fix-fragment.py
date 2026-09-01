with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "<>" in line and "                          <>" in line:
        lines[i] = ""
    if "</>" in line and "                            </>" in line:
        lines[i] = ""
    if "                        )}" in line and i > 1500:
        lines[i] = ""

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
