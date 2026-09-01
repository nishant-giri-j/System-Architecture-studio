with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i in range(630, 650):
    if i < len(lines):
        print(f"{i+1}: {lines[i]}", end="")
