with open("apps/web/components/canvas/architecture-canvas.tsx", "r", encoding="utf-8") as f:
    content = f.read()

bad_str = """                                        <div>
                                        <div>
                                            <h3 className="mb-2 inline-block border-[2px] border-[#161616] bg-[#a18cff] px-2 py-1 font-black uppercase shadow-[2px_2px_0_#161616] text-white">
                                                Information & Reference
                                            </h3>"""
                                            
fixed_str = """                                        <div>
                                            <h3 className="mb-2 inline-block border-[2px] border-[#161616] bg-[#a18cff] px-2 py-1 font-black uppercase shadow-[2px_2px_0_#161616] text-white">
                                                Information & Reference
                                            </h3>"""
                                            
content = content.replace(bad_str, fixed_str)

bad_str2 = """                                        </div>

                                            <h3 className="mb-2 inline-block border-[2px] border-[#161616] bg-[#5de2e7] px-2 py-1 font-black uppercase shadow-[2px_2px_0_#161616]">
                                                Terminal & Sequence
                                            </h3>"""

fixed_str2 = """                                        </div>

                                        <div>
                                            <h3 className="mb-2 inline-block border-[2px] border-[#161616] bg-[#5de2e7] px-2 py-1 font-black uppercase shadow-[2px_2px_0_#161616]">
                                                Terminal & Sequence
                                            </h3>"""
                                            
content = content.replace(bad_str2, fixed_str2)

with open("apps/web/components/canvas/architecture-canvas.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Spacing issue fixed.")
