with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = -1
for i, line in enumerate(lines):
    if "{status !== 'waiting-for-selection' && (" in line:
        start_idx = i
        break

if start_idx != -1:
    lines[start_idx] = ""  # Remove the condition
    
    # We also need to remove the closing tag `</>` and `)}` for this fragment
    end_idx = -1
    for i in range(len(lines) - 1, -1, -1):
        if "                          )}" in lines[i] and "</>" in lines[i-1]:
            lines[i] = ""
            lines[i-1] = ""
            break

    with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
        f.writelines(lines)
        
print("Done")
