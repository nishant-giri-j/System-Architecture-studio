import re

with open("apps/web/components/canvas/architecture-canvas.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace Drawing & Settings
drawing_find = """                                                <li>
                                                    <b>Connect wires:</b> drag
                                                    from a pink dot (source) to
                                                    a yellow dot (target).
                                                </li>
                                            </ul>"""
                                            
drawing_replace = """                                                <li>
                                                    <b>Connect wires:</b> drag
                                                    from a pink dot (source) to
                                                    a yellow dot (target).
                                                </li>
                                                <li>
                                                    <b>Boundaries & Grouping:</b> Add a VPC or Cluster from the Boundaries category. Drag nodes <i>inside</i> the boundary to automatically parent them. Moving the boundary moves all contents.
                                                </li>
                                                <li>
                                                    <b>Wire Styles:</b> Click a wire to set its event name, communication protocol, and Wire Style (Bezier, Step, Straight, Rounded Step).
                                                </li>
                                                <li>
                                                    <b>Select Protocol:</b> Clicking the protocol button opens a full-screen searchable command palette with over 100+ protocols.
                                                </li>
                                            </ul>"""

content = content.replace(drawing_find, drawing_replace)

info_new_section = """                                        <div>
                                            <h3 className="mb-2 inline-block border-[2px] border-[#161616] bg-[#a18cff] px-2 py-1 font-black uppercase shadow-[2px_2px_0_#161616] text-white">
                                                Information & Reference
                                            </h3>
                                            <ul className="list-disc space-y-1.5 pl-4 text-sm font-bold">
                                                <li>
                                                    <b>Info Buttons:</b> Click the <b>(i)</b> button on any tech stack card in the sidebar or any protocol in the wire settings to open the Reference Drawer.
                                                </li>
                                                <li>
                                                    <b>Reference Drawer:</b> A centralized knowledge base providing Overviews, Use Cases, Pros/Cons, and Security tradeoffs for every protocol and technology.
                                                </li>
                                            </ul>
                                        </div>
"""

terminal_find = """                                            <h3 className="mb-2 inline-block border-[2px] border-[#161616] bg-[#5de2e7] px-2 py-1 font-black uppercase shadow-[2px_2px_0_#161616]">
                                                Terminal & Sequence
                                            </h3>"""

content = content.replace(terminal_find, info_new_section + "\n" + terminal_find)

telemetry_find = """                                                <li>
                                                    Use <b>Step</b> to inspect
                                                    the queue: first click from
                                                    idle prepares a paused run,
                                                    then each click processes
                                                    one event. Use <b>Play</b>{' '}
                                                    to leave step mode and
                                                    continue continuously.
                                                </li>
                                            </ul>"""
                                            
telemetry_replace = """                                                <li>
                                                    Use <b>Step</b> to inspect
                                                    the queue: first click from
                                                    idle prepares a paused run,
                                                    then each click processes
                                                    one event. Use <b>Play</b>{' '}
                                                    to leave step mode and
                                                    continue continuously.
                                                </li>
                                                <li>
                                                    <b>Live Telemetry:</b> The HUD at the bottom of the screen tracks real-time RPS, Average Latency, and Error rates as packets travel.
                                                </li>
                                            </ul>"""

content = content.replace(telemetry_find, telemetry_replace)

with open("apps/web/components/canvas/architecture-canvas.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated successfully")
