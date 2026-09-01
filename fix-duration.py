with open('apps/web/app/api/ai/chaos-agent/route.ts', 'r', encoding='utf-8') as f:
    code = f.read()

if "maxDuration" not in code:
    code = "export const maxDuration = 60; // Allow up to 60 seconds for AI generation (Vercel Pro/Hobby config)\n\n" + code
    with open('apps/web/app/api/ai/chaos-agent/route.ts', 'w', encoding='utf-8') as f:
        f.write(code)
