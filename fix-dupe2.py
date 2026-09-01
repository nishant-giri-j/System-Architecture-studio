with open('apps/web/components/canvas/experiment-modal.tsx', 'rb') as f:
    raw = f.read()

try:
    code = raw.decode('utf-8')
except:
    code = raw.decode('utf-16')

# Find the LAST "export function ExperimentModal"
last_idx = code.rfind("export function ExperimentModal")

if last_idx != -1:
    # Get the code from the last export to the end
    clean_code = code[:code.find("const HistoryCharts")] + code[last_idx:]
    with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
        f.write(clean_code)
    print("Stripped duplicates")
else:
    print("Could not find export")
