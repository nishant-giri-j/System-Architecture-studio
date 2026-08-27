with open("help_modal.txt", "r", encoding="utf-16") as f:
    old_content = f.read()

# I want to inject my new bullet points into the existing sections, keeping ALL the old bullets.

# 1. Update Drawing & Settings section
drawing_idx = old_content.find("Drawing & Settings")
if drawing_idx != -1:
    ul_end_idx = old_content.find("</ul>", drawing_idx)
    
    new_drawing_bullets = """
                                                <li>
                                                    <b>Boundaries & Grouping:</b> Add a VPC or Cluster from the Boundaries category. Drag nodes <i>inside</i> the boundary to automatically parent them.
                                                </li>
                                                <li>
                                                    <b>Wire Styles:</b> Click a wire to set its event name, communication protocol, and Wire Style (Bezier, Step, Straight, Rounded Step).
                                                </li>
                                                <li>
                                                    <b>Select Protocol:</b> Clicking the protocol button opens a full-screen searchable command palette with over 100+ protocols.
                                                </li>"""
    old_content = old_content[:ul_end_idx] + new_drawing_bullets + "\n" + old_content[ul_end_idx:]

# 2. Add "Information & Reference" section right after Drawing & Settings
info_section = """
                                        <div>
                                            <h3 className="mb-2 inline-block border-[2px] border-[#161616] bg-[#a18cff] px-2 py-1 font-black uppercase shadow-[2px_2px_0_#161616] text-white">
                                                Information & Reference
                                            </h3>
                                            <ul className="list-disc space-y-1.5 pl-4 text-[11px] font-bold">
                                                <li>
                                                    <b>Info Buttons:</b> Click the <b>(i)</b> button on any tech stack card in the sidebar or any protocol in the wire settings to open the Reference Drawer.
                                                </li>
                                                <li>
                                                    <b>Reference Drawer:</b> A centralized knowledge base providing Overviews, Use Cases, Pros/Cons, and Security tradeoffs for every protocol and technology.
                                                </li>
                                            </ul>
                                        </div>
"""
drawing_div_end = old_content.find("</div>", old_content.find("</ul>", drawing_idx))
old_content = old_content[:drawing_div_end+7] + info_section + old_content[drawing_div_end+7:]


# 3. Add to Terminal & Sequence -> Simulation & Telemetry
terminal_idx = old_content.find("Terminal & Sequence")
if terminal_idx != -1:
    ul_end_idx = old_content.find("</ul>", terminal_idx)
    new_telemetry_bullets = """
                                                <li>
                                                    <b>Live Telemetry:</b> The HUD at the bottom of the screen tracks real-time RPS, Average Latency, and Error rates as packets travel.
                                                </li>"""
    old_content = old_content[:ul_end_idx] + new_telemetry_bullets + "\n" + old_content[ul_end_idx:]


# Now we need to substitute this merged content back into `architecture-canvas.tsx`
with open("apps/web/components/canvas/architecture-canvas.tsx", "r", encoding="utf-8") as f:
    current_app = f.read()

div_start = current_app.find('<div className="flex-1 overflow-y-auto overscroll-contain p-6 text-sm font-medium space-y-8 custom-scrollbar">')
end_idx = current_app.find("                                    </div>\n                                    </div>\n                                </div>", div_start)

old_inner_start = old_content.find('<div className="max-h-[min(70vh,42rem)] space-y-6 overflow-y-auto overscroll-contain p-4 text-xs font-medium">')
old_inner_end = old_content.rfind('</div>\n                                </div>')

inner_html = old_content[old_inner_start + len('<div className="max-h-[min(70vh,42rem)] space-y-6 overflow-y-auto overscroll-contain p-4 text-xs font-medium">'):old_inner_end].strip()

# Adjust text sizes in the old content to match the new larger modal layout
inner_html = inner_html.replace('text-[11px]', 'text-sm').replace('text-[10px]', 'text-xs')

final_replacement = f'<div className="flex-1 overflow-y-auto overscroll-contain p-6 text-sm font-medium space-y-8 custom-scrollbar">\n{inner_html}\n'

updated_app = current_app[:div_start] + final_replacement + current_app[end_idx:]

with open("apps/web/components/canvas/architecture-canvas.tsx", "w", encoding="utf-8") as f:
    f.write(updated_app)

print("Restored original text and appended new features.")
