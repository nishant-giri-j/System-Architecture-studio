with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i in range(850, 920):
    print(f"{i}: {lines[i].strip()}")
