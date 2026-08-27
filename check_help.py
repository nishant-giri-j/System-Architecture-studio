with open("apps/web/components/canvas/architecture-canvas.tsx", "r", encoding="utf-8") as f:
    content = f.read()

start = content.find("{isHelpOpen && (")
if start != -1:
    end = content.find(")}", start + 500)
    help_content = content[start:end+2]
    if "Information & Reference" in help_content:
        print("Found 'Information & Reference'")
    else:
        print("Not Found 'Information & Reference'")
    
    print("\nExtracting sections:")
    for section in ["Drawing & Settings", "Information & Reference", "Terminal & Sequence"]:
        if section in help_content:
            print(f"- {section} is present")
        else:
            print(f"- {section} is MISSING")
