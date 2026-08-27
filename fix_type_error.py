with open("apps/web/components/canvas/architecture-canvas.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix StoredDiagram type
type_find = """type StoredDiagram = {
    nodes: AppNode[];
    edges: EventFlowEdge[];
    viewport?: { x: number; y: number; zoom: number };
};"""
type_replace = """type StoredDiagram = {
    nodes: AppNode[];
    edges: EventFlowEdge[];
    viewport?: { x: number; y: number; zoom: number };
    projectNotes?: string;
};"""
content = content.replace(type_find, type_replace)

# Fix .category TS error in sidebar
sidebar_find = """                                    <div className="flex justify-between items-center border-b-[2px] border-[#161616] pb-1">
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
                                    </div>"""
                                    
sidebar_replace = """                                    <div className="flex justify-between items-center border-b-[2px] border-[#161616] pb-1">
                                        <span>Compute & Services</span>
                                        <span className="bg-[#5de2e7] px-2 py-0.5 border-[2px] border-[#161616]">{nodes.filter(n => {
                                            if (n.type !== 'architecture') return false;
                                            const tech = technologyLibrary.find(t => t.id === n.data.technologyId);
                                            return tech && ['compute', 'service'].includes(tech.category);
                                        }).length}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b-[2px] border-[#161616] pb-1">
                                        <span>Data & Storage</span>
                                        <span className="bg-[#ff4fa3] text-white px-2 py-0.5 border-[2px] border-[#161616]">{nodes.filter(n => {
                                            if (n.type !== 'architecture') return false;
                                            const tech = technologyLibrary.find(t => t.id === n.data.technologyId);
                                            return tech && ['data', 'storage', 'cache'].includes(tech.category);
                                        }).length}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Clients</span>
                                        <span className="bg-[#a18cff] px-2 py-0.5 border-[2px] border-[#161616]">{nodes.filter(n => {
                                            if (n.type !== 'architecture') return false;
                                            const tech = technologyLibrary.find(t => t.id === n.data.technologyId);
                                            return tech && tech.category === 'client';
                                        }).length}</span>
                                    </div>"""
content = content.replace(sidebar_find, sidebar_replace)

with open("apps/web/components/canvas/architecture-canvas.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed type errors!")
