import re

with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# The block to replace is:
# {/* All Historical and Current Charts */}
# <div className="mb-6 flex flex-col gap-12 shrink-0 w-full">
#     {[...history, ...(status === 'running' && results.length > 0 ? [{ plan: plan!, results }] : [])].map((item, index) => (
#       ...
#     ))}
# </div>

start_marker = "{/* All Historical and Current Charts */}"
end_marker = "{history.length === 0 && results.length === 0 && ("

start_idx = code.find(start_marker)
end_idx = code.find(end_marker)

if start_idx != -1 and end_idx != -1:
    block = code[start_idx:end_idx]
    
    # We will define HistoryCharts at the top
    # But wait, nodes is used inside.
    memo_comp = """
const HistoryCharts = React.memo(({ items, nodes }: { items: any[], nodes: any[] }) => {
    return (
        """ + block.replace(
            "{[...history, ...(status === 'running' && results.length > 0 ? [{ plan: plan!, results }] : [])].map((item, index) => (",
            "{items.map((item: any, index: number) => ("
        ) + """
    );
});
"""
    
    # Add memo_comp above ExperimentModal
    code = code.replace('export function ExperimentModal', memo_comp + '\nexport function ExperimentModal')
    
    # Replace block with <HistoryCharts />
    replacement = """{/* All Historical and Current Charts */}
                                <HistoryCharts 
                                    items={[...history, ...(status === 'running' && results.length > 0 ? [{ plan: plan!, results }] : [])]} 
                                    nodes={nodes} 
                                />\n                                """
    
    code = code[:start_idx] + replacement + code[end_idx:]
    
    with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Successfully memoized HistoryCharts!")
else:
    print("Could not find start/end markers.")
