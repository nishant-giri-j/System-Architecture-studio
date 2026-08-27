with open("apps/web/components/canvas/architecture-canvas.tsx", "r", encoding="utf-8") as f:
    content = f.read()

top_find = """export function ArchitectureCanvas() {"""
top_replace = """function CustomCanvasControls() {
    const { zoomIn, zoomOut, fitView } = useReactFlow();
    return (
        <div className="absolute bottom-4 left-4 z-50 flex flex-col border-[3px] border-[#161616] bg-[#ffde59] shadow-[4px_4px_0_#161616]">
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
}

export function ArchitectureCanvas() {"""
content = content.replace(top_find, top_replace)

with open("apps/web/components/canvas/architecture-canvas.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Inserted CustomCanvasControls!")
