import re

with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

pattern = r"                    <div className=\"flex-1 flex flex-col p-6 bg-\[\#fffdf5\] overflow-y-auto relative\">\n                        \{status === 'waiting-for-selection' && \("

new_block = """                    <div className="flex-1 flex flex-col p-6 bg-[#fffdf5] overflow-y-auto relative">
                        {status === 'agent-thinking' && (
                            <div className="border-[3px] border-[#161616] p-8 shadow-[4px_4px_0_#161616] bg-[#ffde59] flex flex-col items-center justify-center mb-6 animate-pulse">
                                <Loader2 size={48} className="text-[#161616] animate-spin mb-4" strokeWidth={3} />
                                <h3 className="font-black text-2xl uppercase text-[#161616] text-center">AI is analyzing results...</h3>
                                <p className="font-bold text-[#161616] text-center mt-2">Generating your next set of experiment options.</p>
                            </div>
                        )}
                        {status === 'waiting-for-selection' && ("""

code = re.sub(pattern, new_block, code)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
