import json

transcript_path = r"C:\Users\nisha\.gemini\antigravity\brain\b6d695e8-6cb8-4902-b981-c0b557ea46a3\.system_generated\logs\transcript_full.jsonl"
full_content = None

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('type') == 'PLANNER_RESPONSE':
                for tc in data.get('tool_calls', []):
                    if tc.get('name') == 'replace_file_content' or tc.get('name') == 'write_to_file':
                        args = tc.get('args', {})
                        if 'edge-properties.tsx' in args.get('TargetFile', ''):
                            if 'JSON:API' in args.get('ReplacementContent', '') or 'JSON:API' in args.get('CodeContent', ''):
                                full_content = args.get('ReplacementContent', '') or args.get('CodeContent', '')
        except:
            pass

with open('missing_protocols.txt', 'w', encoding='utf-8') as f:
    f.write(str(full_content))
