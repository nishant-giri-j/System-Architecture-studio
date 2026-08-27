with open("apps/web/components/canvas/architecture-canvas.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import_find = "Controls,\n    MiniMap,\n    MarkerType,"
import_replace = "Controls,\n    MiniMap,\n    MarkerType,\n    ReactFlowProvider,"
content = content.replace(import_find, import_replace)

main_find = """        <TechContext.Provider value={technologies}>
            <main className="flex h-dvh min-h-[700px] flex-col overflow-hidden bg-[#fffdf5] p-3 sm:p-5 relative">"""
main_replace = """        <TechContext.Provider value={technologies}>
            <ReactFlowProvider>
            <main className="flex h-dvh min-h-[700px] flex-col overflow-hidden bg-[#fffdf5] p-3 sm:p-5 relative">"""
content = content.replace(main_find, main_replace)

main_end_find = """            </main>
        </TechContext.Provider>"""
main_end_replace = """            </main>
            </ReactFlowProvider>
        </TechContext.Provider>"""
content = content.replace(main_end_find, main_end_replace)

# Now remove MiniMap from inside ReactFlow
minimap_inside_find = """                            <MiniMap 
                                position="bottom-right"
                                className="!border-[3px] !border-[#161616] !shadow-[6px_6px_0_#161616] !bg-[#fffdf5] !rounded-none"
                                nodeColor="#a18cff"
                                nodeStrokeColor="#161616"
                                nodeStrokeWidth={2}
                                maskColor="rgba(0, 0, 0, 0.1)"
                                pannable
                                zoomable
                            />"""
content = content.replace(minimap_inside_find, "")

# Now add MiniMap to the bottom of the Right Sidebar
aside_bottom_find = """                                    <Eraser size={16} strokeWidth={3} /> Clear
                                    Canvas
                                </button>
                            </div>
                        </div>
                    </aside>"""
aside_bottom_replace = """                                    <Eraser size={16} strokeWidth={3} /> Clear
                                    Canvas
                                </button>
                            </div>
                            
                            <div className="mt-6 border-[3px] border-[#161616] bg-white p-3 shadow-[4px_4px_0_#161616]">
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
                            </div>
                        </div>
                    </aside>"""
content = content.replace(aside_bottom_find, aside_bottom_replace)

with open("apps/web/components/canvas/architecture-canvas.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Moved MiniMap to Right Sidebar")
