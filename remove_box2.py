import re
with open("apps/web/components/canvas/architecture-canvas.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Using regex to remove the block
pattern = r"\{!isPlaying && \(\s*<div className=\"pointer-events-none.*?Connect pink handles.*?</div>\s*\)\}"
new_content, count = re.subn(pattern, "", content, flags=re.DOTALL)

with open("apps/web/components/canvas/architecture-canvas.tsx", "w", encoding="utf-8") as f:
    f.write(new_content)
    
print(f"Removed {count} instances.")
