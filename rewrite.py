import re

with open('apps/web/components/canvas/node-properties.tsx', 'r') as f:
    code = f.read()

code = code.replace(
    'export function NodePropertiesPanel({',
    'export function NodePropertiesPanel({\n    onDeleteNode,'
)
code = code.replace(
    'onClose: () => void;',
    'onClose: () => void;\n    onDeleteNode?: (nodeId: string) => void;'
)

code = code.replace(
    'const [editingStepId, setEditingStepId] = useState<string | null>(null);',
    '''const [editingStepId, setEditingStepId] = useState<string | null>(null);

    const [draftSteps, setDraftSteps] = useState<LogicStep[]>([]);
    const [draftDelay, setDraftDelay] = useState<number>(0);
    const [draftLatency, setDraftLatency] = useState<NodeLatencyConfig>({});
    const [draftStrategy, setDraftStrategy] = useState<'broadcast' | 'load-balance'>('broadcast');
    const [draftDisabled, setDraftDisabled] = useState<boolean>(false);
    const [draftErrorRate, setDraftErrorRate] = useState<number>(0);

    useEffect(() => {
        if (node) {
            setDraftSteps(node.data.logicSteps || []);
            setDraftDelay(node.data.processingDelay || 0);
            setDraftLatency(node.data.latency || {});
            setDraftStrategy(node.data.routingStrategy || 'broadcast');
            setDraftDisabled(node.data.disabled || false);
            setDraftErrorRate(node.data.errorRate || 0);
        }
    }, [nodeId, node?.data]);'''
)

code = code.replace(
    'const steps = node.data.logicSteps || [];\n    const latency = node.data.latency || {};',
    'const steps = draftSteps;\n    const latency = draftLatency;'
)

code = re.sub(
    r'onUpdateNode\(node\.id, steps, node\.data\.processingDelay, \{\s*\.\.\.latency,\s*\[field\]: value,\s*\}, node\.data\.routingStrategy\);',
    'setDraftLatency(prev => ({ ...prev, [field]: value }));',
    code
)

code = re.sub(
    r'onUpdateNode\(node\.id, updatedSteps, node\.data\.processingDelay, node\.data\.latency, node\.data\.routingStrategy\);',
    'setDraftSteps(updatedSteps);',
    code
)

code = re.sub(
    r'onUpdateNode\(\s*node\.id,\s*\[\.\.\.steps, newStep\],\s*node\.data\.processingDelay,\s*node\.data\.latency,\s*node\.data\.routingStrategy,\s*\);',
    'setDraftSteps([...steps, newStep]);',
    code
)

code = re.sub(
    r'onUpdateNode\(\s*node\.id,\s*steps\.filter\(\(s\) => s\.id !== stepId\),\s*node\.data\.processingDelay,\s*node\.data\.latency,\s*node\.data\.routingStrategy,\s*\);',
    'setDraftSteps(steps.filter(s => s.id !== stepId));',
    code
)

code = code.replace('checked={!node.data.disabled}', 'checked={!draftDisabled}')

code = re.sub(
    r'onUpdateNode\(\s*node\.id,\s*steps,\s*node\.data\.processingDelay,\s*node\.data\.latency,\s*node\.data\.routingStrategy,\s*!e\.target\.checked\s*\);',
    'setDraftDisabled(!e.target.checked);',
    code
)

code = code.replace('value={node.data.processingDelay || 0}', 'value={draftDelay}')

code = re.sub(
    r'onUpdateNode\(\s*node\.id,\s*steps,\s*parseInt\(e\.target\.value\),\s*node\.data\.latency,\s*node\.data\.routingStrategy\s*\)',
    'setDraftDelay(parseInt(e.target.value))',
    code
)

code = code.replace('{node.data.processingDelay || 0}ms', '{draftDelay}ms')

code = code.replace("value={node.data.routingStrategy || 'broadcast'}", "value={draftStrategy}")

code = re.sub(
    r'onUpdateNode\(node\.id, steps, node\.data\.processingDelay, node\.data\.latency, newStrategy\);',
    'setDraftStrategy(newStrategy);',
    code
)

errorRateBlock = '''
                <div className="mb-6 border-[3px] border-[#161616] p-3 shadow-[4px_4px_0_#161616] bg-white">
                    <label className="flex flex-col gap-1 text-sm font-black uppercase">
                        Simulated Error / Drop Rate
                        <div className="flex items-center gap-2 mt-2">
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={draftErrorRate}
                                onChange={(e) => setDraftErrorRate(parseFloat(e.target.value))}
                                className="w-full accent-[#ff6b6b]"
                            />
                            <span className="w-16 text-right whitespace-nowrap text-[#ff6b6b]">
                                {Math.round(draftErrorRate * 100)}%
                            </span>
                        </div>
                        <span className="text-[10px] font-bold text-[#161616]/70 leading-tight mt-1 normal-case">
                            Simulate packet loss or a node crash. At 100%, all incoming packets are instantly destroyed.
                        </span>
                    </label>
                </div>
'''

code = re.sub(
    r'(<\/label>\s*<\/div>\s*)<div className="mb-6 border-\[3px\] border-\[#161616\] p-3 shadow-\[4px_4px_0_#161616\] bg-white">\s*<label className="flex flex-col gap-1 text-sm font-black uppercase">\s*Routing Strategy',
    r'\1' + errorRateBlock + r'\n                <div className="mb-6 border-[3px] border-[#161616] p-3 shadow-[4px_4px_0_#161616] bg-white">\n                    <label className="flex flex-col gap-1 text-sm font-black uppercase">\n                        Routing Strategy',
    code
)

code = code.replace(
    '<div className="neo-panel absolute right-4 top-4 bottom-4 z-[9999] flex w-80 flex-col overflow-hidden bg-white shadow-[8px_8px_0_#161616]">',
    '<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onPointerDown={() => onClose()}>\n            <div className="neo-panel w-full max-w-md bg-white flex flex-col shadow-[12px_12px_0_#161616] max-h-[85vh]" onPointerDown={(e) => e.stopPropagation()}>'
)

code = code.replace(
    '<div className="flex items-center justify-between border-b-[3px] border-[#161616] bg-[#5de2e7] p-3">\\n                <h3 className="font-black uppercase truncate pr-2">',
    '<div className="flex items-center justify-between border-b-[3px] border-[#161616] bg-[#5de2e7] p-4">\\n                <h3 className="font-black uppercase truncate pr-2 text-lg">'
)
code = re.sub(
    r'<button\s*onClick=\{onClose\}\s*className="neo-button flex-shrink-0 p-1 hover:bg-white"\s*>\s*<X size=\{16\} strokeWidth=\{3\} \/>\s*<\/button>\s*<\/div>\s*<div className="flex-1 overflow-y-auto p-4 bg-\[#f8f9fa\]">',
    '<button onClick={onClose} className="hover:bg-black/10 p-1 transition-colors border-[2px] border-transparent hover:border-[#161616]"><X size={20} strokeWidth={3} /></button></div><div className="flex-1 overflow-y-auto p-4 bg-[#f8f9fa] custom-scrollbar">',
    code
)

footerReplacement = '''
                )}
            </div>

            <div className="border-t-[3px] border-[#161616] bg-gray-50 px-4 py-3 flex gap-3">
                <button 
                    onClick={() => {
                        onUpdateNode(node.id, draftSteps, draftDelay, draftLatency, draftStrategy, draftDisabled, draftErrorRate);
                        onClose();
                    }}
                    className="flex-1 neo-button bg-[#5de2e7] hover:bg-[#4bcad0] py-2 flex items-center justify-center gap-2 text-sm font-black tracking-wide"
                >
                    <Save className="w-4 h-4" strokeWidth={3}/> SAVE CHANGES
                </button>
                
                {onDeleteNode && (
                    <button 
                        onClick={() => {
                            onDeleteNode(node.id);
                            onClose();
                        }}
                        className="neo-button bg-[#ff6b6b] hover:bg-[#e85b5b] px-4 flex items-center justify-center text-white"
                        title="Delete Node"
                    >
                        <Trash2 className="w-4 h-4" strokeWidth={3} />
                    </button>
                )}
            </div>
        </div>
        </div>
    );
'''

code = re.sub(
    r'                \)\}\s*<\/div>\s*<\/div>\s*\);\s*\}',
    footerReplacement + '}',
    code
)

with open('apps/web/components/canvas/node-properties.tsx', 'w') as f:
    f.write(code)
