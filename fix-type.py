with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace("export type ExperimentResult = {\n    stepIndex: number;\n    value: number;", "export type ExperimentResult = {\n    stepIndex: number;\n    value: any;")

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
