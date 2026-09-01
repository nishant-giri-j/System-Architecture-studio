with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i in range(max(0, len(lines)-40), len(lines)):
    print(f"{i+1}: {lines[i].strip()}")
