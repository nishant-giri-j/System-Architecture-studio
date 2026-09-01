import re

with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update Props
props_pattern = re.compile(r"interface ExperimentModalProps \{.*?\n\s+nodes: Node<ArchitectureNodeData>\[\];\n\s+setNodes: \(nodes: Node<ArchitectureNodeData>\[\]\) => void;", re.DOTALL)
def props_replacer(match):
    return match.group(0) + "\n    edges: any[];\n    setEdges: (edges: any[]) => void;"
code = props_pattern.sub(props_replacer, code)

# 2. Update destructuring
destruct_pattern = re.compile(r"export function ExperimentModal\(\{\s+isOpen,\s+onClose,\s+nodes,\s+setNodes,", re.DOTALL)
new_destruct = "export function ExperimentModal({\n    isOpen,\n    onClose,\n    nodes,\n    setNodes,\n    edges,\n    setEdges,"
code = destruct_pattern.sub(new_destruct, code)

# 3. Update originalNodeState
code = code.replace("const originalNodeState = useRef<any>(null);", "const originalNodes = useRef<any[]>([]);\n    const originalEdges = useRef<any[]>([]);")

# 4. Update the save logic
save_logic_old = """                                                const target = nodes.find(n => n.id === p.targetNodeId);
                                                if (target) {
                                                    originalNodeState.current = { id: target.id, data: JSON.parse(JSON.stringify(target.data)) };
                                                }"""
save_logic_new = """                                                originalNodes.current = JSON.parse(JSON.stringify(nodes));
                                                originalEdges.current = JSON.parse(JSON.stringify(edges));"""
code = code.replace(save_logic_old, save_logic_new)

# 5. Update restores
restore_old1 = """        if (originalNodeState.current) {
            setNodes(nodes.map(n => n.id === originalNodeState.current.id ? { ...n, data: originalNodeState.current.data } : n));
        }"""
restore_new1 = """        if (originalNodes.current.length > 0) {
            setNodes(originalNodes.current);
            setEdges(originalEdges.current);
        }"""
code = code.replace(restore_old1, restore_new1)

restore_old2 = """            if (originalNodeState.current) {
                setNodes(nodes.map(n => n.id === originalNodeState.current.id ? { ...n, data: originalNodeState.current.data } : n));
            }"""
restore_new2 = """            if (originalNodes.current.length > 0) {
                setNodes(originalNodes.current);
                setEdges(originalEdges.current);
            }"""
code = code.replace(restore_old2, restore_new2)

# 6. Update mutation execution
exec_pattern = re.compile(r"// 1\. Mutate the target node's data.*?\}\)\);", re.DOTALL)
exec_new = """        // 1. Apply all structural mutations
        let nextNodes = JSON.parse(JSON.stringify(originalNodes.current.length > 0 ? originalNodes.current : nodes));
        let nextEdges = JSON.parse(JSON.stringify(originalEdges.current.length > 0 ? originalEdges.current : edges));
        
        if (plan.mutations) {
            plan.mutations.forEach(m => {
                const val = m.values[currentStep];
                if (m.action === 'UPDATE_NODE' && m.targetId && m.targetField) {
                    nextNodes = nextNodes.map((n: any) => {
                        if (n.id === m.targetId) {
                            const newData = JSON.parse(JSON.stringify(n.data));
                            const keys = m.targetField!.split('.');
                            let currentObj = newData;
                            for (let i = 0; i < keys.length - 1; i++) {
                                if (!currentObj[keys[i]]) currentObj[keys[i]] = {};
                                currentObj = currentObj[keys[i]];
                            }
                            currentObj[keys[keys.length - 1]] = val;
                            return { ...n, data: newData };
                        }
                        return n;
                    });
                } else if (m.action === 'DELETE_NODE' && m.targetId) {
                    if (val) {
                        nextNodes = nextNodes.filter((n: any) => n.id !== m.targetId);
                        nextEdges = nextEdges.filter((e: any) => e.source !== m.targetId && e.target !== m.targetId);
                    }
                } else if (m.action === 'DELETE_EDGE' && m.targetId) {
                    if (val) {
                        nextEdges = nextEdges.filter((e: any) => e.id !== m.targetId);
                    }
                }
            });
        }
        setNodes(nextNodes);
        setEdges(nextEdges);"""
code = exec_pattern.sub(exec_new, code)

# 7. Update UI for History and Card rendering
# This is tricky because it uses plan.targetNodeId and plan.targetField heavily
# We'll replace it with a helper component or just stringify mutations.

def replacer_ui1(match):
    # This is for the option card
    return """<div className="flex flex-col gap-1 mt-1 mb-2">
                                                {p.mutations && p.mutations.map((m, mIdx) => (
                                                    <div key={mIdx} className="text-xs font-bold text-neutral-600">
                                                        [{m.action}] {m.targetId} {m.targetField ? `(${m.targetField})` : ''}
                                                    </div>
                                                ))}
                                            </div>"""
code = re.sub(r'<div className="text-xs font-bold text-neutral-600">TARGET: \{nodes\.find\(n => n\.id === p\.targetNodeId\)\?\.data\.label \|\| p\.targetNodeId\} &mdash; FIELD: \{p\.targetField\}</div>', replacer_ui1, code)

def replacer_ui2(match):
    # This is for the history card header in the charts section
    return "Experiment {index + 1}: {item.plan.title || 'Structural Test'}"
code = re.sub(r"Experiment \{index \+ 1\}: \{item\.plan\.targetField\} on \{nodes\.find\(n => n\.id === item\.plan\.targetNodeId\)\?\.data\.label \|\| item\.plan\.targetNodeId\}", replacer_ui2, code)

# 8. Update Test Plan History left sidebar UI
sidebar_history_old = """                                        <div className="bg-[#161616] text-[#ffde59] p-2 text-xs font-bold">
                                            TARGET: {nodes.find(n => n.id === p.targetNodeId)?.data.label || p.targetNodeId}
                                        </div>
                                        <div className="bg-[#161616] text-[#5de2e7] p-2 text-xs font-bold break-all">
                                            FIELD: {p.targetField}
                                        </div>
                                        <div className="bg-[#161616] text-[#ff4fa3] p-2 text-xs font-bold">
                                            STEPS: {p.steps.join(' \u2192 ')}
                                        </div>"""
sidebar_history_new = """                                        <div className="bg-[#161616] text-[#ffde59] p-2 text-[10px] font-bold font-mono">
                                            {p.mutations && p.mutations.map((m, mIdx) => (
                                                <div key={mIdx} className="mb-1 last:mb-0">
                                                    [{m.action}] {m.targetId} {m.targetField ? `(${m.targetField})` : ''}
                                                    <div className="text-[#5de2e7] ml-2">VALUES: {m.values.join(' \\u2192 ')}</div>
                                                </div>
                                            ))}
                                        </div>"""
code = code.replace(sidebar_history_old, sidebar_history_new)

# 9. Update the step indicator text in running state
step_indicator_old = """<div className="text-sm font-bold truncate text-[#161616]">Target: <span className="text-neutral-500">{plan?.targetNodeId}</span></div>
                            <div className="text-sm font-bold truncate text-[#161616]">Field: <span className="text-[#5de2e7]">{plan?.targetField}</span></div>
                            <div className="text-sm font-black text-[#ff4fa3]">Value: {plan?.steps[currentStep]}</div>"""
step_indicator_new = """<div className="text-xs font-bold text-[#161616] max-h-24 overflow-y-auto">
                                {plan?.mutations && plan.mutations.map((m, mIdx) => (
                                    <div key={mIdx}>
                                        <span className="text-neutral-500">[{m.action}] {m.targetId} {m.targetField}</span>
                                        <span className="text-[#ff4fa3] ml-2">Value: {JSON.stringify(m.values[currentStep])}</span>
                                    </div>
                                ))}
                            </div>"""
code = code.replace(step_indicator_old, step_indicator_new)

# 10. Update the Experiment count label in running state
code = code.replace("{plan?.steps.length || 5}", "{plan?.stepCount || 5}")


with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
