with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "onClick={handleDownload}" in line:
        # found the button, we need to put <> above it if missing
        if "                              " not in lines[i-2] and "<>" not in lines[i-2]:
            lines[i-2] = "                              <>\n"
        break

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
