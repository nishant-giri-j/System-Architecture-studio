with open('apps/web/components/canvas/experiment-modal.tsx', 'rb') as f:
    raw = f.read()

try:
    code = raw.decode('utf-8')
except:
    code = raw.decode('utf-16')

parts = code.split("export function ExperimentModal")
print(f"Found {len(parts)} parts")
if len(parts) >= 3:
    # There's the header before the first, the first function body, and then the second, etc.
    # Let's write just the header + the FIRST function body
    first_body = parts[1]
    
    with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
        f.write(parts[0] + "export function ExperimentModal" + first_body)
    print("Extracted first body")
