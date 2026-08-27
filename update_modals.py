with open("apps/web/components/canvas/architecture-canvas.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update imports
import_find = "    X,\n} from 'lucide-react';"
import_replace = "    X,\n    BarChart,\n    FileText,\n} from 'lucide-react';"
content = content.replace(import_find, import_replace)

# 2. Add state variables
state_find = '    const [projectNotes, setProjectNotes] = useState("");'
state_replace = """    const [projectNotes, setProjectNotes] = useState("");
    const [isStatsOpen, setIsStatsOpen] = useState(false);
    const [isNotesOpen, setIsNotesOpen] = useState(false);"""
content = content.replace(state_find, state_replace)

# 3. Add download functions
funcs_find = """    const handleExportPNG = useCallback(() => {"""
funcs_replace = """    const downloadNotesTxt = useCallback(() => {
        const blob = new Blob([projectNotes], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'project-notes.txt';
        a.click();
        URL.revokeObjectURL(url);
    }, [projectNotes]);

    const downloadNotesJson = useCallback(() => {
        const blob = new Blob([JSON.stringify({ notes: projectNotes }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'project-notes.json';
        a.click();
        URL.revokeObjectURL(url);
    }, [projectNotes]);

    const handleExportPNG = useCallback(() => {"""
content = content.replace(funcs_find, funcs_replace)

# 4. Replace sidebar content with buttons
sidebar_find = """                            <div className="mt-6 border-[3px] border-[#161616] bg-white p-3 shadow-[4px_4px_0_#161616]">
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

sidebar_replace = """                            <div className="mt-6 flex flex-col gap-3">
                                <button
                                    onClick={() => setIsStatsOpen(true)}
                                    className="neo-button flex w-full items-center justify-center gap-2 border-[3px] border-[#161616] bg-[#ffde59] px-3 py-3 text-sm font-black uppercase shadow-[3px_3px_0_#161616] hover:bg-[#ebd05c]"
                                    type="button"
                                >
                                    <BarChart size={18} strokeWidth={3} /> View Stats
                                </button>
                                <button
                                    onClick={() => setIsNotesOpen(true)}
                                    className="neo-button flex w-full items-center justify-center gap-2 border-[3px] border-[#161616] bg-[#5de2e7] px-3 py-3 text-sm font-black uppercase shadow-[3px_3px_0_#161616] hover:bg-[#48c9ce]"
                                    type="button"
                                >
                                    <FileText size={18} strokeWidth={3} /> Project Notes
                                </button>
                            </div>"""
content = content.replace(sidebar_find, sidebar_replace)

# 5. Add Modals
modals_insert = """            </main>
            </ReactFlowProvider>
        </TechContext.Provider>"""
        
modals_replace = """                {/* Stats Modal */}
                {isStatsOpen && (
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setIsStatsOpen(false)}>
                        <div className="w-full max-w-sm bg-[#fffdf5] border-[3px] border-[#161616] shadow-[12px_12px_0_#161616] flex flex-col animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between border-b-[3px] border-[#161616] p-4 bg-[#ffde59]">
                                <h2 className="font-black uppercase tracking-wider text-lg flex items-center gap-2"><BarChart size={20} strokeWidth={3}/> Architecture Stats</h2>
                                <button onClick={() => setIsStatsOpen(false)} className="neo-button p-1.5 hover:bg-white bg-white/50" title="Close"><X size={18} strokeWidth={3} /></button>
                            </div>
                            <div className="p-6 flex flex-col gap-3 text-sm font-bold">
                                <div className="flex justify-between items-center border-b-[2px] border-[#161616] pb-2">
                                    <span>Total Components</span>
                                    <span className="bg-[#ffde59] px-2 py-0.5 border-[2px] border-[#161616]">{nodes.length}</span>
                                </div>
                                <div className="flex justify-between items-center border-b-[2px] border-[#161616] pb-2">
                                    <span>Connections</span>
                                    <span className="bg-[#ffde59] px-2 py-0.5 border-[2px] border-[#161616]">{edges.length}</span>
                                </div>
                                <div className="flex justify-between items-center border-b-[2px] border-[#161616] pb-2">
                                    <span>Compute & Services</span>
                                    <span className="bg-[#5de2e7] px-2 py-0.5 border-[2px] border-[#161616]">{nodes.filter(n => {
                                        if (n.type !== 'architecture') return false;
                                        const tech = technologyLibrary.find(t => t.id === n.data.technologyId);
                                        return tech && ['compute', 'service'].includes(tech.category);
                                    }).length}</span>
                                </div>
                                <div className="flex justify-between items-center border-b-[2px] border-[#161616] pb-2">
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
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notes Modal */}
                {isNotesOpen && (
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setIsNotesOpen(false)}>
                        <div className="w-full max-w-2xl bg-[#fffdf5] border-[3px] border-[#161616] shadow-[12px_12px_0_#161616] flex flex-col animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between border-b-[3px] border-[#161616] p-4 bg-[#5de2e7]">
                                <h2 className="font-black uppercase tracking-wider text-lg flex items-center gap-2"><FileText size={20} strokeWidth={3}/> Project Notes</h2>
                                <button onClick={() => setIsNotesOpen(false)} className="neo-button p-1.5 hover:bg-white bg-white/50" title="Close"><X size={18} strokeWidth={3} /></button>
                            </div>
                            <div className="p-4">
                                <textarea
                                    className="neo-input w-full min-h-[300px] p-3 text-sm font-bold leading-relaxed resize-y custom-scrollbar"
                                    placeholder="Jot down architectural decisions, requirements, or deployment notes here..."
                                    value={projectNotes}
                                    onChange={(e) => setProjectNotes(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="border-t-[3px] border-[#161616] p-4 bg-gray-50 flex justify-end gap-3">
                                <button onClick={downloadNotesTxt} className="neo-button flex items-center gap-2 bg-white border-[3px] border-[#161616] px-4 py-2 text-xs font-black uppercase shadow-[2px_2px_0_#161616] hover:bg-[#ffde59]">
                                    <Download size={16} strokeWidth={3}/> Download .TXT
                                </button>
                                <button onClick={downloadNotesJson} className="neo-button flex items-center gap-2 bg-white border-[3px] border-[#161616] px-4 py-2 text-xs font-black uppercase shadow-[2px_2px_0_#161616] hover:bg-[#a18cff]">
                                    <Download size={16} strokeWidth={3}/> Download .JSON
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            </ReactFlowProvider>
        </TechContext.Provider>"""
content = content.replace(modals_insert, modals_replace)

with open("apps/web/components/canvas/architecture-canvas.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated to buttons and modals!")
