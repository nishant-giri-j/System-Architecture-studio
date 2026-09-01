import re

with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace(
    "<span>Testing Step {currentStep + 1} of {plan?.steps.length || 5}</span>",
    "<span>Attempt {attemptCount + 1}: Step {currentStep + 1} of {plan?.steps.length || 5}</span>"
)
code = code.replace(
    "<span>Testing Step {currentStep + 1} of 5</span>",
    "<span>Attempt {attemptCount + 1}: Step {currentStep + 1} of {plan?.steps.length || 5}</span>"
)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
