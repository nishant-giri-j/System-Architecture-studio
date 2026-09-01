with open("apps/web/components/canvas/experiment-modal.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if "handleStartChaosAgent" in line:
        print(f"Line {i}: {line.strip()}")
