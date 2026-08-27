with open("apps/web/components/canvas/architecture-canvas.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add useReactFlow to imports
import_xy_find = """    MarkerType,
    ReactFlowProvider,
    ReactFlow,
    useEdgesState,
    useNodesState,
    type Connection,"""
import_xy_replace = """    MarkerType,
    ReactFlowProvider,
    ReactFlow,
    useEdgesState,
    useNodesState,
    useReactFlow,
    type Connection,"""
content = content.replace(import_xy_find, import_xy_replace)

# Add Plus, Minus, Maximize to lucide-react imports
import_lucide_find = """    BarChart,
    FileText,
} from 'lucide-react';"""
import_lucide_replace = """    BarChart,
    FileText,
    Plus,
    Minus,
    Maximize,
} from 'lucide-react';"""
content = content.replace(import_lucide_find, import_lucide_replace)

# Define CustomControls component at the very top of the file, just below imports
top_find = """export const DND_MIME = 'application/architecture-technology';"""
top_replace = """export const DND_MIME = 'application/architecture-technology';

function CustomCanvasControls() {
    const { zoomIn, zoomOut, fitView } = useReactFlow();
    return (
        <div className="absolute bottom-4 right-4 z-50 flex flex-col border-[3px] border-[#161616] bg-[#ffde59] shadow-[4px_4px_0_#161616]">
            <button onClick={() => zoomIn()} className="neo-button flex items-center justify-center p-2 hover:bg-white border-b-[3px] border-[#161616] transition-colors" title="Zoom In" type="button">
                <Plus size={22} strokeWidth={3} />
            </button>
            <button onClick={() => zoomOut()} className="neo-button flex items-center justify-center p-2 hover:bg-white border-b-[3px] border-[#161616] transition-colors" title="Zoom Out" type="button">
                <Minus size={22} strokeWidth={3} />
            </button>
            <button onClick={() => fitView({ padding: 0.2, duration: 200 })} className="neo-button flex items-center justify-center p-2 hover:bg-white transition-colors" title="Fit View" type="button">
                <Maximize size={20} strokeWidth={3} />
            </button>
        </div>
    );
}"""
content = content.replace(top_find, top_replace)

# Remove the broken <Controls /> from ReactFlow
controls_find = """                            <Background color="#161616" gap={22} size={1} />
                            <Controls showInteractive={false} className="border-[3px] border-[#161616] shadow-[4px_4px_0_#161616] !bg-[#ffde59] !text-[#161616] [&>button]:border-b-[3px] [&>button]:border-[#161616] [&>button:last-child]:border-0 hover:[&>button]:bg-white transition-colors" />

                        </ReactFlow>"""
controls_replace = """                            <Background color="#161616" gap={22} size={1} />
                            
                            <CustomCanvasControls />
                        </ReactFlow>"""
content = content.replace(controls_find, controls_replace)

# The user mentioned controls being on the left originally or right?
# The ReactFlow controls are usually bottom-left by default. 
# Wait! Let's check where log window is. It is absolute bottom-4 left-16.
# My CustomCanvasControls was placed `bottom-4 right-4`? No, let's place it at bottom-4 left-4 to match where it was before, or bottom-4 left-4 is blocked by log button?
# Log button is at `bottom-4 left-16`. Oh wait, if log button is `left-16`, that's 4rem (64px). 
# A custom controls panel at `left-4` (16px) with width of roughly 42px fits perfectly to the left of the log button!
# Let's adjust CustomCanvasControls to be left-4

left_replace = content.replace('bottom-4 right-4', 'bottom-4 left-4')

with open("apps/web/components/canvas/architecture-canvas.tsx", "w", encoding="utf-8") as f:
    f.write(left_replace)
print("Implemented CustomCanvasControls")
