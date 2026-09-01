with open('apps/web/components/canvas/architecture-canvas.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "The AI Architect Tools" in line:
        # found the header, we want the enclosing <div>.
        # Let's search backwards for the nearest <div>
        for j in range(i, -1, -1):
            if "<div>" in lines[j]:
                start_idx = j
                break
    if start_idx != -1 and i > start_idx:
        if "</ul>" in line:
            # The div ends a couple lines after ul
            for j in range(i, len(lines)):
                if "</div>" in lines[j]:
                    end_idx = j
                    break
            if end_idx != -1:
                break

if start_idx != -1 and end_idx != -1:
    new_block = [
        "                                        <div>\n",
        "                                            <h3 className=\"mb-2 inline-block border-[2px] border-[#161616] bg-[#ff4fa3] text-white px-2 py-1 font-black uppercase shadow-[2px_2px_0_#161616]\">\n",
        "                                                ? The AI Architect Tools\n",
        "                                            </h3>\n",
        "                                            <p className=\"mb-3 text-sm text-[#161616] font-medium\">Architecture Studio has an integrated Senior Principal Engineer. Let the AI do the heavy lifting!</p>\n",
        "                                            <ul className=\"list-disc space-y-2 pl-4 text-sm font-bold\">\n",
        "                                                <li>\n",
        "                                                    <span className=\"text-[#ff4fa3]\">Prompt-to-Architecture:</span> Click the sparkles icon in the header. Type a description like \"E-commerce backend with Postgres and Kafka\", and the AI will generate the entire diagram, including nodes, wires, and internal logic routing.\n",
        "                                                </li>\n",
        "                                                <li>\n",
        "                                                    <span className=\"text-[#ff4fa3]\">Security & Reliability Review:</span> Click the shield icon. The AI will scan your architecture to find missing authentication, network vulnerabilities, bottlenecks, and single points of failure.\n",
        "                                                </li>\n",
        "                                                <li>\n",
        "                                                    <span className=\"text-[#ff4fa3]\">Logic Flow Tester:</span> Click the test tube icon. The AI runs a deep architectural scan to trace logic flow and find infinite loops, routing black holes, protocol mismatches, and missing fallbacks.\n",
        "                                                </li>\n",
        "                                                <li>\n",
        "                                                    <span className=\"text-[#ff4fa3]\">Chaos Parameter Sweeper:</span> Click the AI Tools Dropdown, then \"Open Sweeper\". The AI acts as a Chaos Monkey, systematically breaking your system (spiking latency, crashing nodes) across an infinite turn-based experimental loop. It lets you choose experiments, runs physics simulations, and generates a beautiful interactive PDF report!\n",
        "                                                </li>\n",
        "                                                <li>\n",
        "                                                    <span className=\"text-[#ff4fa3]\">Explain Architecture:</span> The AI can read any complex system diagram and write a plain-english architectural walkthrough of exactly how the data flows from start to finish.\n",
        "                                                </li>\n",
        "                                                <li>\n",
        "                                                    <span className=\"text-[#ff4fa3]\">? Auto-Resolve:</span> A smart AI repair engine! Whenever the <b>System Watchdog</b> detects a bottleneck at runtime, or the AI testers find a vulnerability, click the <span className=\"bg-[#5de2e7] border-2 border-[#161616] px-1\">? Auto Resolve</span> button. The AI will instantly generate a patch and physically fix the architecture.\n",
        "                                                </li>\n",
        "                                            </ul>\n",
        "                                        </div>\n"
    ]
    
    lines = lines[:start_idx] + new_block + lines[end_idx+1:]
    
    with open('apps/web/components/canvas/architecture-canvas.tsx', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("Replaced successfully!")
else:
    print("Could not find bounds.")

