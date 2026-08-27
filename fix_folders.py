with open("apps/web/components/canvas/tech-palette.tsx", "r", encoding="utf-8") as f:
    content = f.read()

find_str = """              defaultOpen={search.length > 0 || category === "client" || category === "network"}"""
replace_str = """              defaultOpen={search.length > 0}"""
content = content.replace(find_str, replace_str)

with open("apps/web/components/canvas/tech-palette.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed defaultOpen categories!")
