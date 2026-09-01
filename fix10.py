with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

outer_div_old = """        <div className={`fixed inset-0 z-[99999] flex p-6 transition-all duration-500 ease-in-out pointer-events-auto ${
            isMinimized 
                ? 'items-end justify-start bg-transparent' 
                : 'items-center justify-center bg-black/50 backdrop-blur-sm'
        }`}>
            <div className={`flex flex-col bg-[#fffdf5] border-[4px] border-[#161616] shadow-[8px_8px_0_#161616] transition-all duration-500 overflow-hidden ${"""

outer_div_new = """        <div 
            onClick={() => {
                if (!isMinimized && status !== 'running' && status !== 'agent-thinking') {
                    onClose();
                }
            }}
            className={`fixed inset-0 z-[99999] flex p-6 transition-all duration-500 ease-in-out ${
                isMinimized 
                    ? 'items-end justify-start bg-transparent pointer-events-none' 
                    : 'items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto'
            }`}
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                className={`pointer-events-auto flex flex-col bg-[#fffdf5] border-[4px] border-[#161616] shadow-[8px_8px_0_#161616] transition-all duration-500 overflow-hidden ${"""

code = code.replace(outer_div_old, outer_div_new)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
