with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i in range(1500, len(lines)):
    if lines[i].strip():
        print(f"{i}: {lines[i].strip().encode('ascii', 'ignore').decode('ascii')}")
