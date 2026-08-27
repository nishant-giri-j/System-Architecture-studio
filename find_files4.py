import json

transcript_path = r"C:\Users\nisha\.gemini\antigravity\brain\b6d695e8-6cb8-4902-b981-c0b557ea46a3\.system_generated\logs\transcript_full.jsonl"
edits = []

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('type') == 'PLANNER_RESPONSE':
                for tc in data.get('tool_calls', []):
                    if tc.get('name') == 'replace_file_content':
                        args = tc.get('args', {})
                        if 'technology.ts' in args.get('TargetFile', ''):
                            edits.append(args.get('ReplacementContent', ''))
        except:
            pass

with open('tech_edits.txt', 'w', encoding='utf-8') as f:
    for i, e in enumerate(edits):
        f.write(f"--- EDIT {i} ---\n{e}\n")
