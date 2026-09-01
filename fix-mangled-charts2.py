with open("apps/web/components/canvas/experiment-modal.tsx", "r", encoding="utf-8") as f:
    text = f.read()

bad_str = """                        {status === 'waiting-for-selection' && (
                            <div className="border-[3px] border-[#161616] bg-[#5de2e7] text-[#161616] p-4 font-black uppercase text-center mb-6 shadow-[4px_4px_0_#161616] animate-pulse">
                                Please select an experiment from the left panel to continue.
                            </div>
                        )}
                        
                        {/* All Historical and Current Charts */}"""

good_str = """                        {status === 'waiting-for-selection' && (
                            <div className="border-[3px] border-[#161616] bg-[#5de2e7] text-[#161616] p-4 font-black uppercase text-center mb-6 shadow-[4px_4px_0_#161616] animate-pulse">
                                Please select an experiment from the left panel to continue.
                            </div>
                        )}
                        {status !== 'waiting-for-selection' && (
                            <>
                        {/* All Historical and Current Charts */}"""

text = text.replace(bad_str, good_str)

with open("apps/web/components/canvas/experiment-modal.tsx", "w", encoding="utf-8") as f:
    f.write(text)
