with open("apps/web/components/canvas/architecture-canvas.tsx", "r", encoding="utf-8") as f:
    content = f.read()

start = content.find("Canvas User Guide</span>")
end = content.find(")}", start + 500)
print(content[start:end])
