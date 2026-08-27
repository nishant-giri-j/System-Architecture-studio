with open("apps/web/components/canvas/architecture-canvas.tsx", "r", encoding="utf-8") as f:
    content = f.read()

end_replace_new = """                                    </div>
                                    </div>
                                </div>
                            )}"""

print(content.count(end_replace_new))
