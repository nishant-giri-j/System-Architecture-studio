import re

with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

pattern = re.compile(r"\{conclusion\.replace\(\/.*?\}\s*</Markdown>", re.DOTALL)
code = pattern.sub("{conclusion}\n                                            </Markdown>", code)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
