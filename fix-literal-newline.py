with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# I will just write the block exactly as it should be
good_block = """        const conclusionHtml = conclusion
            .replace(/\\n\\n/g, '</p><p>')
            .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
            .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-black mb-4">$1</h1>')
            .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-4 border-b-2 border-neutral-800 pb-2">$1</h2>')
            .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-6 mb-3">$1</h3>')
            .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>');"""

import re
# Regex to find everything from "const conclusionHtml = conclusion" up to the html variable declaration
pattern = re.compile(r"const conclusionHtml = conclusion.*?\.replace\(\/\^- \(\.\*\$\)\/gim, '<li class=\"ml-4 list-disc\">\$1<\/li>'\);", re.DOTALL)

code = pattern.sub(good_block, code)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
