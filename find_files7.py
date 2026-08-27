import json

transcript_path = r"C:\Users\nisha\.gemini\antigravity\brain\b6d695e8-6cb8-4902-b981-c0b557ea46a3\.system_generated\logs\transcript_full.jsonl"
res = ""

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            content = data.get('content', '')
            if 'protocolGroups' in content and 'Connect RPC' in content:
                res += content + "\n\n"
        except:
            pass

with open('missing_protocols.txt', 'w', encoding='utf-8') as f:
    f.write(str(res))
