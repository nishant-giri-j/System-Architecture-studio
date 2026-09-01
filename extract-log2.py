import json

log_path = r'C:\Users\nisha\.gemini\antigravity\brain\47b053fa-fb70-48fc-8a12-0c37786625f9\.system_generated\logs\transcript_full.jsonl'

best_code = None

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if 'tool_calls' in data:
                for call in data['tool_calls']:
                    args = call['function'].get('arguments', {})
                    if 'experiment-modal.tsx' in str(args):
                        cmd = args.get('CommandLine', '')
                        if 'Set-Content' in cmd and 'export function ExperimentModal' in cmd:
                            # Split by @'
                            parts = cmd.split("@'")
                            for p in parts:
                                if "export function ExperimentModal" in p:
                                    best_code = p.split("'@")[0]
        except Exception as e:
            pass

if best_code:
    with open('extracted-modal-from-log.txt', 'w', encoding='utf-8') as f:
        f.write(best_code)
    print('Found and extracted from Set-Content!')
else:
    print('Not found in Set-Content')
