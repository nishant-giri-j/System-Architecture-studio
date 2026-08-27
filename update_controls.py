import re

with open("apps/web/components/canvas/architecture-canvas.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace SPEED
speed_find = """                        <label className="header-control neo-control flex shrink-0 items-center gap-2 bg-[#fffdf5] px-3">
                            Speed
                            <select
                                className="h-9 bg-transparent px-1 font-black outline-none\""""
                                
speed_replace = """                        <label className="header-control neo-control flex shrink-0 items-center gap-2 bg-[#f0f0f0] px-3" title="Playback speed">
                            <span className="font-black text-gray-700 text-[10px] uppercase">Speed</span>
                            <select
                                className="h-7 bg-white border-[2px] border-[#161616] px-1 text-xs font-black shadow-[2px_2px_0_#161616] outline-none cursor-pointer hover:bg-gray-50 transition-colors\""""

content = content.replace(speed_find, speed_replace)

# Replace RPS
rps_find = """                        <label className="header-control neo-control flex shrink-0 items-center gap-2 bg-[#fffdf5] px-3">
                            RPS
                            <input
                                className="w-14 bg-transparent font-black outline-none"
                                type="number\""""

rps_replace = """                        <label className="header-control neo-control flex shrink-0 items-center gap-2 bg-[#f0f0f0] px-3" title="Requests per second">
                            <span className="font-black text-gray-700 text-[10px] uppercase">RPS</span>
                            <input
                                className="w-16 h-7 bg-white border-[2px] border-[#161616] px-1 text-xs font-black shadow-[2px_2px_0_#161616] outline-none hover:bg-gray-50 transition-colors"
                                type="number\""""

content = content.replace(rps_find, rps_replace)


# Replace Max In Flight
maxflight_find = """                        <label className="header-control neo-control flex shrink-0 items-center gap-2 bg-[#fffdf5] px-3">
                            Max In Flight
                            <input
                                className="w-12 bg-transparent font-black outline-none"
                                type="number\""""

maxflight_replace = """                        <label className="header-control neo-control flex shrink-0 items-center gap-2 bg-[#f0f0f0] px-3" title="Maximum concurrent requests">
                            <span className="font-black text-gray-700 text-[10px] uppercase">Max Flight</span>
                            <input
                                className="w-14 h-7 bg-white border-[2px] border-[#161616] px-1 text-xs font-black shadow-[2px_2px_0_#161616] outline-none hover:bg-gray-50 transition-colors"
                                type="number\""""

content = content.replace(maxflight_find, maxflight_replace)

with open("apps/web/components/canvas/architecture-canvas.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated controls")
