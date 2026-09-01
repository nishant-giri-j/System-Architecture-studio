with open("apps/web/components/canvas/experiment-modal.tsx", "r", encoding="utf-8") as f:
    text = f.read()

import re

# We want to replace the mangled block:
#                         {status === 'waiting-for-selection' && (
#
#                             <div className="border-[3px] borde{/* All Historical and Current Charts */}
#
#                                 <HistoryCharts 
#
#                                     items={[...history, ...(status === 'running' && results.length > 0 ? [{ plan: plan!, results }] : [])]} 
#
#                                     nodes={nodes} 
#
#                                 />
#
#                                            )}
# 
#                                 {/* All Historical and Current Charts */}

# The easiest way is to use a regex or string slice.
start_str = "{/* Main Content (Charts / Report) */}"
end_str = "{/* All Historical and Current Charts */}"
end_str_2 = "<div className=\"mb-6 flex flex-col gap-12 shrink-0 w-full\">"

start_idx = text.find(start_str)
end_idx = text.find(end_str_2, start_idx)

if start_idx != -1 and end_idx != -1:
    good_str = """{/* Main Content (Charts / Report) */}
                    <div className="flex-1 flex flex-col p-6 bg-[#fffdf5] overflow-y-auto relative">
                        {status === 'waiting-for-selection' && (
                            <div className="border-[3px] border-[#161616] bg-[#5de2e7] text-[#161616] p-4 font-black uppercase text-center mb-6 shadow-[4px_4px_0_#161616] animate-pulse">
                                Please select an experiment from the left panel to continue.
                            </div>
                        )}
                        
                        {/* All Historical and Current Charts */}
                        """
    text = text[:start_idx] + good_str + text[end_idx:]
    with open("apps/web/components/canvas/experiment-modal.tsx", "w", encoding="utf-8") as f:
        f.write(text)
    print("Fixed mangled div")
else:
    print("Could not find bounds")

