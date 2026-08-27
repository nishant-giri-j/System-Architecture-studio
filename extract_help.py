with open("apps/web/components/canvas/architecture-canvas.tsx", "r", encoding="utf-8") as f:
    content = f.read()

start_idx = content.find("{isHelpOpen && (")
if start_idx != -1:
    # Find matching closing brace/parentheses
    brace_count = 0
    paren_count = 0
    end_idx = start_idx
    started = False
    
    for i in range(start_idx, len(content)):
        if content[i] == '{': brace_count += 1
        elif content[i] == '}': brace_count -= 1
        elif content[i] == '(': paren_count += 1
        elif content[i] == ')': paren_count -= 1
        
        if content[i] == '(': started = True
        
        if started and brace_count == 0 and paren_count == 0:
            end_idx = i + 1
            break
            
    print(content[start_idx:end_idx])
