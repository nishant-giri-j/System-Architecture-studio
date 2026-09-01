import re

with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Remove value = plan.steps[currentStep]
code = code.replace("const value = plan.steps[currentStep] as number;", "")

# Fix TypeScript indexing errors
bad = """                            for (let i = 0; i < keys.length - 1; i++) {
                                if (!currentObj[keys[i]]) currentObj[keys[i]] = {};
                                currentObj = currentObj[keys[i]];
                            }
                            currentObj[keys[keys.length - 1]] = val;"""
good = """                            for (let i = 0; i < keys.length - 1; i++) {
                                const k = keys[i] as string;
                                if (!currentObj[k]) currentObj[k] = {};
                                currentObj = currentObj[k];
                            }
                            const lastKey = keys[keys.length - 1] as string;
                            currentObj[lastKey] = val;"""
code = code.replace(bad, good)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
