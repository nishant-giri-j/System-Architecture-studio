with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "const conclusionHtml = conclusion" in line:
        start_idx = i
    if "const html = `<!DOCTYPE html>" in line:
        end_idx = i
        break

good_block = [
    "        const conclusionHtml = conclusion\n",
    "            .replace(/\\\\n\\\\n/g, '</p><p>')\n",
    "            .replace(/\\\\*\\\\*(.*?)\\\\*\\\\*/g, '<strong>$1</strong>')\n",
    "            .replace(/^# (.*$)/gim, '<h1 class=\"text-3xl font-black mb-4\">$1</h1>')\n",
    "            .replace(/^## (.*$)/gim, '<h2 class=\"text-2xl font-bold mt-8 mb-4 border-b-2 border-neutral-800 pb-2\">$1</h2>')\n",
    "            .replace(/^### (.*$)/gim, '<h3 class=\"text-xl font-bold mt-6 mb-3\">$1</h3>')\n",
    "            .replace(/^- (.*$)/gim, '<li class=\"ml-4 list-disc\">$1</li>');\n\n"
]

lines = lines[:start_idx] + good_block + lines[end_idx:]

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
