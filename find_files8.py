import json

transcript_path = r"C:\Users\nisha\.gemini\antigravity\brain\b6d695e8-6cb8-4902-b981-c0b557ea46a3\.system_generated\logs\transcript_full.jsonl"
full_content = None

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('step_index') == 1596:
                full_content = data.get('content', '')
        except:
            pass

with open('full_old_edge.txt', 'w', encoding='utf-8') as f:
    f.write(str(full_content))
