import json
import os

log_path = r'C:\Users\nisha\.gemini\antigravity\brain\47b053fa-fb70-48fc-8a12-0c37786625f9\.system_generated\logs\transcript_full.jsonl'

best_code = None

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if 'tool_calls' in data:
                for call in data['tool_calls']:
                    if call['function']['name'] == 'default_api:write_to_file':
                        args = call['function']['arguments']
                        if 'experiment-modal.tsx' in args.get('TargetFile', ''):
                            best_code = args.get('CodeContent', '')
        except Exception as e:
            pass

if best_code:
    with open('extracted-modal-from-log.txt', 'w', encoding='utf-8') as f:
        f.write(best_code)
    print('Found and extracted from write_to_file!')
else:
    print('Not found in write_to_file')
