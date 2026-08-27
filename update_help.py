with open("apps/web/components/canvas/architecture-canvas.tsx", "r", encoding="utf-8") as f:
    content = f.read()

find_str = """                                            </ul>
                                        </div>

                                        <div>
                                            <h3 className="mb-2 inline-block border-[2px] border-[#161616] bg-[#5de2e7] px-2 py-1 font-black uppercase shadow-[2px_2px_0_#161616]">
                                                Terminal & Sequence"""
                                                
replace_str = """                                            </ul>
                                        </div>

                                        <div>
                                            <h3 className="mb-2 inline-block border-[2px] border-[#161616] bg-[#ffde59] px-2 py-1 font-black uppercase shadow-[2px_2px_0_#161616]">
                                                Architecture Tools
                                            </h3>
                                            <ul className="list-disc space-y-1.5 pl-4 text-sm font-bold">
                                                <li>
                                                    <b>Architecture Stats:</b> Click the <b>View Stats</b> button in the Right Sidebar (Canvas Tools) to see a live telemetry pop-up counting all components, connections, compute, and databases.
                                                </li>
                                                <li>
                                                    <b>Project Notes:</b> Click <b>Project Notes</b> in the Right Sidebar to open a dedicated workspace scratchpad. Jot down requirements or architectural decisions.
                                                </li>
                                                <li>
                                                    <b>Export Notes:</b> From inside the Project Notes window, you can seamlessly download your notes locally as a <b>.TXT</b> or <b>.JSON</b> file.
                                                </li>
                                                <li>
                                                    <b>Persistent State:</b> Your Project Notes automatically save alongside your canvas state!
                                                </li>
                                                <li>
                                                    <b>Massive Knowledge Base:</b> Every single one of the 275+ technologies and protocols now features highly specific, unique documentation tailored to it.
                                                </li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h3 className="mb-2 inline-block border-[2px] border-[#161616] bg-[#5de2e7] px-2 py-1 font-black uppercase shadow-[2px_2px_0_#161616]">
                                                Terminal & Sequence"""
content = content.replace(find_str, replace_str)

with open("apps/web/components/canvas/architecture-canvas.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated Help Guide!")
