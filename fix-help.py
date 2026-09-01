with open('apps/web/components/canvas/architecture-canvas.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

import re

old_ai_tools = """                                        <div>
                                            <h3 className="mb-2 inline-block border-[2px] border-[#161616] bg-[#ff4fa3] text-white px-2 py-1 font-black uppercase shadow-[2px_2px_0_#161616]">
                                                ? The AI Architect Tools
                                            </h3>
                                            <p className="mb-3 text-sm text-[#161616] font-medium">Architecture Studio has an integrated Senior Principal Engineer. Let the AI do the heavy lifting!</p>
                                            <ul className="list-disc space-y-2 pl-4 text-sm font-bold">
                                                <li>
                                                    <span className="text-[#ff4fa3]">Prompt-to-Architecture:</span> Click the sparkles icon in the header. Type a description like "E-commerce backend with Postgres and Kafka", and the AI will generate the entire diagram, including nodes, wires, and internal logic routing.
                                                </li>
                                                <li>
                                                    <span className="text-[#ff4fa3]">Security Review:</span> Click the shield icon. The AI will scan your architecture to find missing authentication, network vulnerabilities, bottlenecks, and single points of failure.
                                                </li>
                                                <li>
                                                    <span className="text-[#ff4fa3]">Logic Tester:</span> Click the test tube icon. The AI will run a deep architectural scan to trace logic flow and find infinite loops, routing black holes, protocol mismatches, and missing fallbacks.
                                                </li>
                                                <li>
                                                    <span className="text-[#ff4fa3]">? Auto-Resolve:</span> A smart AI repair engine! Whenever the <b>System Watchdog</b> detects a bottleneck at runtime, or the <b>Security / Logic Testers</b> find a vulnerability, click the <span className="bg-[#5de2e7] border-2 border-[#161616] px-1">? Auto Resolve</span> button. The AI will instantly analyze the problem, generate a patch, and physically fix the architecture on the canvas (injecting Queues, rewiring connections, handling bidirectional responses, or tweaking cache rates).
                                                </li>
                                            </ul>
                                        </div>"""

new_ai_tools = """                                        <div>
                                            <h3 className="mb-2 inline-block border-[2px] border-[#161616] bg-[#ff4fa3] text-white px-2 py-1 font-black uppercase shadow-[2px_2px_0_#161616]">
                                                ? The AI Architect Tools
                                            </h3>
                                            <p className="mb-3 text-sm text-[#161616] font-medium">Architecture Studio has an integrated Senior Principal Engineer. Let the AI do the heavy lifting!</p>
                                            <ul className="list-disc space-y-2 pl-4 text-sm font-bold">
                                                <li>
                                                    <span className="text-[#ff4fa3]">Prompt-to-Architecture:</span> Click the sparkles icon in the header. Type a description like "E-commerce backend with Postgres and Kafka", and the AI will generate the entire diagram, including nodes, wires, and internal logic routing.
                                                </li>
                                                <li>
                                                    <span className="text-[#ff4fa3]">Security & Reliability Review:</span> Click the shield icon. The AI will scan your architecture to find missing authentication, network vulnerabilities, bottlenecks, and single points of failure.
                                                </li>
                                                <li>
                                                    <span className="text-[#ff4fa3]">Logic Flow Tester:</span> Click the test tube icon. The AI runs a deep architectural scan to trace logic flow and find infinite loops, routing black holes, protocol mismatches, and missing fallbacks.
                                                </li>
                                                <li>
                                                    <span className="text-[#ff4fa3]">Chaos Parameter Sweeper:</span> Click the AI Tools Dropdown, then "Open Sweeper". The AI acts as a Chaos Monkey, systematically breaking your system (spiking latency, crashing nodes) across an infinite turn-based experimental loop. It lets you choose experiments, runs physics simulations, and generates a beautiful interactive PDF/HTML report!
                                                </li>
                                                <li>
                                                    <span className="text-[#ff4fa3]">Explain Architecture:</span> The AI can read any complex system diagram and write a plain-english architectural walkthrough of exactly how the data flows from start to finish.
                                                </li>
                                                <li>
                                                    <span className="text-[#ff4fa3]">? Auto-Resolve:</span> A smart AI repair engine! Whenever the <b>System Watchdog</b> detects a bottleneck at runtime, or the AI testers find a vulnerability, click the <span className="bg-[#5de2e7] border-2 border-[#161616] px-1">? Auto Resolve</span> button. The AI will instantly generate a patch and physically fix the architecture (injecting Queues, rewiring connections, tweaking cache rates).
                                                </li>
                                            </ul>
                                        </div>"""

# Replace exact strings ignoring minor spacing if regex is used, but a literal replace might fail due to indentation or emoji mismatches.
# Let's use a regex to grab the section between "? The AI Architect Tools" and the next </div>
pattern = re.compile(r"<div>\s*<h3[^>]*>\s*? The AI Architect Tools\s*</h3>.*?</ul>\s*</div>", re.DOTALL)
code = pattern.sub(new_ai_tools.strip(), code)

with open('apps/web/components/canvas/architecture-canvas.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
