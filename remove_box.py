with open("apps/web/components/canvas/architecture-canvas.tsx", "r", encoding="utf-8") as f:
    content = f.read()

find_str = """                                {!isPlaying && (
                                    <div className="pointer-events-none border-[3px] border-[#161616] bg-[#fffdf5] px-3 py-2 text-xs font-bold shadow-[3px_3px_0_#161616]">
                                        Connect pink handles ? name the event ? {' '}
                                        <span className="text-[#d91570]">
                                            Click Play
                                        </span>
                                    </div>
                                )}"""

content = content.replace(find_str, "")

with open("apps/web/components/canvas/architecture-canvas.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Removed text box")
