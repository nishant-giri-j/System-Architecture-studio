import re

with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

bad = """                                <p className="font-bold text-sm mb-6 text-[#161616]">
                                    The AI has analyzed the results and proposes the following distinct tests. Choose one to execute:
                                </p>"""

good = """                                {conclusion && (
                                    <div className="mb-6 p-4 border-[3px] border-[#161616] bg-[#5de2e7] text-black">
                                        <h4 className="font-black uppercase text-sm mb-2">AI Analysis of Latest Results:</h4>
                                        <div className="prose prose-sm max-w-none font-medium">
                                            <Markdown>{conclusion}</Markdown>
                                        </div>
                                    </div>
                                )}
                                <p className="font-bold text-sm mb-6 text-[#161616]">
                                    The AI has analyzed the results and proposes the following distinct tests. Choose one to execute:
                                </p>"""

code = code.replace(bad, good)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
