with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("Line 1060-1065:")
for i in range(1058, 1065):
    if i < len(lines):
        print(f"{i+1}: {lines[i].strip()}")

print("\nLine 1540-1550:")
for i in range(1538, 1550):
    if i < len(lines):
        print(f"{i+1}: {lines[i].strip()}")
