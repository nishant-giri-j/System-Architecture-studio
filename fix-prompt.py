with open('apps/web/app/api/ai/chaos-agent/route.ts', 'r', encoding='utf-8') as f:
    code = f.read()

old_rule = "- If you have successfully answered the prompt (e.g., you broke the system, or you tried a few things and concluded it's perfectly resilient), or if the user forced a stop, output 'CONCLUDE' and provide a detailed Markdown report."

new_rule = "- Output 'PROPOSE_EXPERIMENTS' to provide the user with 2 to 3 distinct test plan options for their next step. You must ALWAYS propose more experiments unless the user explicitly forced a stop.\n- ONLY output 'CONCLUDE' if the prompt explicitly says 'THE USER HAS HALTED FURTHER EXPERIMENTS'. Do not conclude on your own."

code = code.replace(old_rule, new_rule)

with open('apps/web/app/api/ai/chaos-agent/route.ts', 'w', encoding='utf-8') as f:
    f.write(code)
