with open("apps/web/components/canvas/architecture-canvas.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import_find = "Controls,\n    MarkerType,"
import_replace = "Controls,\n    MiniMap,\n    MarkerType,"

content = content.replace(import_find, import_replace)

minimap_find = """                            <Background color="#161616" gap={22} size={1} />
                            <Controls showInteractive={false} />
                        </ReactFlow>"""

minimap_replace = """                            <Background color="#161616" gap={22} size={1} />
                            <Controls showInteractive={false} className="border-[3px] border-[#161616] shadow-[4px_4px_0_#161616] !bg-[#ffde59] !text-[#161616] [&>button]:border-b-[3px] [&>button]:border-[#161616] [&>button:last-child]:border-0 hover:[&>button]:bg-white transition-colors" />
                            <MiniMap 
                                position="bottom-right"
                                className="!border-[3px] !border-[#161616] !shadow-[6px_6px_0_#161616] !bg-[#fffdf5] !rounded-none"
                                nodeColor="#a18cff"
                                nodeStrokeColor="#161616"
                                nodeStrokeWidth={2}
                                maskColor="rgba(0, 0, 0, 0.1)"
                                pannable
                                zoomable
                            />
                        </ReactFlow>"""
                        
content = content.replace(minimap_find, minimap_replace)

with open("apps/web/components/canvas/architecture-canvas.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Added MiniMap and styled Controls")
