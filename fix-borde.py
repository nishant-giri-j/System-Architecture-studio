import re
with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# We need to find `className="border-[3px] borde{/* All Historical and Current Charts */}`
# and replace it with:
# className="border-[3px] border-[#161616] p-6 shadow-[4px_4px_0_#161616] bg-white flex flex-col mb-6">
# ... wait, that was the wrapper for Select Next Experiment!

# Let's just fix the string interpolation error!
code = re.sub(r'className="border-\[3px\] borde\{/\* All Historical and Current Charts \*/\}',
              r'className="border-[3px] border-[#161616] p-6 shadow-[4px_4px_0_#161616] bg-white flex flex-col mb-6">',
              code)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("done borde")
