with open("apps/web/components/canvas/architecture-canvas.tsx", "r", encoding="utf-8") as f:
    content = f.read()

end_replace_old = """                                    </div>
                                </div>
                            )}"""
                            
end_replace_new = """                                    </div>
                                    </div>
                                </div>
                            )}"""

# Revert all
content = content.replace(end_replace_new, end_replace_old)

# Now, we know {isHelpOpen && ( starts the help modal.
start_idx = content.find("{isHelpOpen && (")

# We want to replace the first `end_replace_old` that appears AFTER `start_idx`.
if start_idx != -1:
    next_end = content.find(end_replace_old, start_idx)
    if next_end != -1:
        content = content[:next_end] + end_replace_new + content[next_end + len(end_replace_old):]

with open("apps/web/components/canvas/architecture-canvas.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Reverted and fixed")
