with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

import re

# We will wrap the history map block into a memoized component.
# The history block is:
# {history.map((item, idx) => ( ... ))}
# It starts at:
#                                 <div className="flex flex-col gap-6 mb-8">
#                                     {history.map((item, idx) => (
# and ends with:
#                                     ))}
#                                     
#                                     {history.length === 0 && results.length === 0 && (

old_block_regex = re.compile(r"(\s*)<div className=\"flex flex-col gap-6 mb-8\">\s*\{history\.map\(\(item, idx\) => \(\s*<div key=\{idx\}(.*?)\)\)}\s*\{history\.length === 0 && results\.length === 0 && \(", re.DOTALL)

match = old_block_regex.search(code)
if match:
    indent = match.group(1)
    # Extract the map body
    full_match = match.group(0)
    
    # We will create a memoized component at the top of the file
    memo_comp = """
const HistoryCharts = React.memo(({ history, nodes }: { history: any[], nodes: any[] }) => {
    return (
        <div className="flex flex-col gap-6 mb-8">
            {history.map((item, idx) => (
                <div key={idx}""" + match.group(2) + """)
            )}
        </div>
    );
});
"""
    
    # We need to insert this before `export function ExperimentModal`
    code = code.replace('export function ExperimentModal', memo_comp + '\nexport function ExperimentModal')
    
    # And replace the original block
    replacement = indent + '<HistoryCharts history={history} nodes={nodes} />\n' + indent + '{history.length === 0 && results.length === 0 && ('
    code = code.replace(full_match, replacement)
    
    with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Recharts memoized successfully.")
else:
    print("Could not find the history block to memoize.")

