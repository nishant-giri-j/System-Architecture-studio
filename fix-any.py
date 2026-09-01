with open("apps/web/components/canvas/experiment-modal.tsx", "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace("x => x.stepIndex", "(x: any) => x.stepIndex")

with open("apps/web/components/canvas/experiment-modal.tsx", "w", encoding="utf-8") as f:
    f.write(text)
