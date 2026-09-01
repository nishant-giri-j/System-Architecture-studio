with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if "const handleDownload = () =>" in line:
        for j in range(i, i+150):
            print(f"{j}: {lines[j].rstrip()}")
        break
