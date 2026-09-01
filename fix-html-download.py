# coding=utf-8
import re

with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# We need to fix the TS syntax error caused by literal newlines in the regex
code = code.replace(
    ".replace(/\n\n/g, '</p><p>')",
    ".replace(/\\n\\n/g, '</p><p>')"
)
code = code.replace(
    ".replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')",
    ".replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')"
)
code = code.replace(
    ".replace(/^# (.*$)/gim, '<h1 class=\"text-3xl font-black mb-4\">$1</h1>')",
    ".replace(/^# (.*$)/gim, '<h1 class=\"text-3xl font-black mb-4\">$1</h1>')"
)
code = code.replace(
    ".replace(/^## (.*$)/gim, '<h2 class=\"text-2xl font-bold mt-8 mb-4 border-b-2 border-neutral-800 pb-2\">$1</h2>')",
    ".replace(/^## (.*$)/gim, '<h2 class=\"text-2xl font-bold mt-8 mb-4 border-b-2 border-neutral-800 pb-2\">$1</h2>')"
)
code = code.replace(
    ".replace(/^### (.*$)/gim, '<h3 class=\"text-xl font-bold mt-6 mb-3\">$1</h3>')",
    ".replace(/^### (.*$)/gim, '<h3 class=\"text-xl font-bold mt-6 mb-3\">$1</h3>')"
)
code = code.replace(
    ".replace(/^- (.*$)/gim, '<li class=\"ml-4 list-disc\">$1</li>');",
    ".replace(/^- (.*$)/gim, '<li class=\"ml-4 list-disc\">$1</li>');"
)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
