with open("apps/web/components/canvas/architecture-canvas.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add projectNotes to StoredDiagram
type_find = """type StoredDiagram = {
    nodes: AppNode[];
    edges: EventFlowEdge[];
};"""
type_replace = """type StoredDiagram = {
    nodes: AppNode[];
    edges: EventFlowEdge[];
    projectNotes?: string;
};"""
content = content.replace(type_find, type_replace)

# Add projectNotes state
state_find = """    const [isHydrated, setIsHydrated] = useState(false);"""
state_replace = """    const [isHydrated, setIsHydrated] = useState(false);
    const [projectNotes, setProjectNotes] = useState("");"""
content = content.replace(state_find, state_replace)

# Add loading of projectNotes
load_find = """                    setNodes(saved.nodes);
                    setEdges(saved.edges);
                }"""
load_replace = """                    setNodes(saved.nodes);
                    setEdges(saved.edges);
                    if (saved.projectNotes) setProjectNotes(saved.projectNotes);
                }"""
content = content.replace(load_find, load_replace)

# Add saving of projectNotes
save_find = """            JSON.stringify({ nodes, edges } satisfies StoredDiagram),"""
save_replace = """            JSON.stringify({ nodes, edges, projectNotes } satisfies StoredDiagram),"""
content = content.replace(save_find, save_replace)
save_deps_find = """    }, [edges, isHydrated, nodes]);"""
save_deps_replace = """    }, [edges, isHydrated, nodes, projectNotes]);"""
content = content.replace(save_deps_find, save_deps_replace)

# Add importing of projectNotes
import_find = """                if (payload.nodes && payload.edges) {
                    setNodes(payload.nodes);
                    setEdges(payload.edges);
                }"""
import_replace = """                if (payload.nodes && payload.edges) {
                    setNodes(payload.nodes);
                    setEdges(payload.edges);
                    if (payload.projectNotes) setProjectNotes(payload.projectNotes);
                }"""
content = content.replace(import_find, import_replace)

# Add exporting of projectNotes
export_find = """            JSON.stringify({ nodes, edges }, null, 2),"""
export_replace = """            JSON.stringify({ nodes, edges, projectNotes }, null, 2),"""
content = content.replace(export_find, export_replace)

# Replace the MiniMap section with Statistics and Notes
sidebar_find = """                            <div className="mt-6 border-[3px] border-[#161616] bg-white p-3 shadow-[4px_4px_0_#161616]">
                                <p className="mb-2 text-xs font-black uppercase">
                                    Minimap
                                </p>
                                <div className="h-40 w-full relative border-[3px] border-[#161616] bg-[#fffdf5]">
                                    <MiniMap 
                                        className="!m-0 !w-full !h-full"
                                        nodeColor="#a18cff"
                                        nodeStrokeColor="#161616"
                                        nodeStrokeWidth={2}
                                        maskColor="rgba(0, 0, 0, 0.1)"
                                        pannable
                                        zoomable
                                    />
                                </div>
                            </div>"""
                            
sidebar_replace = """                            <div className="mt-6 border-[3px] border-[#161616] bg-white p-3 shadow-[4px_4px_0_#161616]">
                                <p className="mb-2 text-xs font-black uppercase">
                                    Architecture Stats
                                </p>
                                <div className="flex flex-col gap-2 text-xs font-bold">
                                    <div className="flex justify-between items-center border-b-[2px] border-[#161616] pb-1">
                                        <span>Total Components</span>
                                        <span className="bg-[#ffde59] px-2 py-0.5 border-[2px] border-[#161616]">{nodes.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b-[2px] border-[#161616] pb-1">
                                        <span>Connections</span>
                                        <span className="bg-[#ffde59] px-2 py-0.5 border-[2px] border-[#161616]">{edges.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b-[2px] border-[#161616] pb-1">
                                        <span>Compute & Services</span>
                                        <span className="bg-[#5de2e7] px-2 py-0.5 border-[2px] border-[#161616]">{nodes.filter(n => ['compute', 'service'].includes(n.data?.category as string)).length}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b-[2px] border-[#161616] pb-1">
                                        <span>Data & Storage</span>
                                        <span className="bg-[#ff4fa3] text-white px-2 py-0.5 border-[2px] border-[#161616]">{nodes.filter(n => ['data', 'storage', 'cache'].includes(n.data?.category as string)).length}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Clients</span>
                                        <span className="bg-[#a18cff] px-2 py-0.5 border-[2px] border-[#161616]">{nodes.filter(n => n.data?.category === 'client').length}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 border-[3px] border-[#161616] bg-white p-3 shadow-[4px_4px_0_#161616]">
                                <p className="mb-2 text-xs font-black uppercase">
                                    Project Notes
                                </p>
                                <textarea
                                    className="neo-input w-full min-h-[120px] p-2 text-xs font-bold leading-relaxed resize-y custom-scrollbar"
                                    placeholder="Jot down architectural decisions, requirements, or deployment notes here..."
                                    value={projectNotes}
                                    onChange={(e) => setProjectNotes(e.target.value)}
                                />
                            </div>"""
content = content.replace(sidebar_find, sidebar_replace)

with open("apps/web/components/canvas/architecture-canvas.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated right sidebar!")
