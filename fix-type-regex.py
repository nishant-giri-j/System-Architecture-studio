import re

with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = re.sub(r"export type ExperimentResult = \{.*?stepIndex: number;.*?value: number;", "export type ExperimentResult = {\n    stepIndex: number;\n    value: any;", code, flags=re.DOTALL)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
