with open('apps/web/app/api/ai/chaos-agent/route.ts', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace("- If you need to gather data, output 'PROPOSE_EXPERIMENTS' and provide 2 to 3 distinct test plan options for the \nuser to choose from.\n", "")
code = code.replace("- If you need to gather data, output 'PROPOSE_EXPERIMENTS' and provide 2 to 3 distinct test plan options for the user to choose from.\n", "")

with open('apps/web/app/api/ai/chaos-agent/route.ts', 'w', encoding='utf-8') as f:
    f.write(code)
