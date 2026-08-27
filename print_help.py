with open("apps/web/components/canvas/architecture-canvas.tsx", "r", encoding="utf-8") as f:
    content = f.read()

start_idx = content.find("Canvas User Guide</span>")
end_idx = content.find("Packet Legend", start_idx)
print(content[start_idx:end_idx + 100])
