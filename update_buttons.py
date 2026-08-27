import re

with open("apps/web/components/canvas/architecture-canvas.tsx", "r", encoding="utf-8") as f:
    content = f.read()

pause_find = """                            <button
                                className={`flex items-center gap-2 px-3 text-sm font-black uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${isPaused ? 'bg-[#ffde59]' : 'bg-[#fffdf5] hover:bg-[#ffde59]'}`}
                                onClick={() => {"""

pause_replace = """                            <button
                                className={`flex items-center gap-2 px-3 text-sm font-black uppercase transition-colors disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:opacity-100 ${isPaused ? 'bg-[#ffde59]' : 'bg-[#fffdf5] hover:bg-[#ffde59]'}`}
                                onClick={() => {"""

content = content.replace(pause_find, pause_replace)

step_find = """                        <button
                            className="header-control neo-button flex shrink-0 items-center gap-2 bg-[#5de2e7] px-3"
                            onClick={stepSimulation}
                            type="button"
                            title="Process one simulation event while paused"
                            disabled={isPlaying && !isPaused}
                        >"""
                        
step_replace = """                        <button
                            className="header-control neo-button flex shrink-0 items-center gap-2 bg-[#5de2e7] px-3 disabled:!bg-gray-200 disabled:!text-gray-400 disabled:!border-gray-400 disabled:shadow-none disabled:translate-y-[3px] disabled:translate-x-[3px] disabled:cursor-not-allowed"
                            onClick={stepSimulation}
                            type="button"
                            title="Process one simulation event while paused"
                            disabled={isPlaying && !isPaused}
                        >"""

content = content.replace(step_find, step_replace)

stop_find = """                        <button
                            className="header-control neo-button flex shrink-0 items-center gap-2 bg-[#ff6b6b] px-3 disabled:cursor-not-allowed disabled:opacity-40"
                            onClick={stopSimulation}
                            type="button"
                            title="Stop simulation and clear active packets"
                            disabled={!isPlaying && !isPaused && !isSingleCycle}
                        >"""

stop_replace = """                        <button
                            className="header-control neo-button flex shrink-0 items-center gap-2 bg-[#ff6b6b] px-3 disabled:!bg-gray-200 disabled:!text-gray-400 disabled:!border-gray-400 disabled:shadow-none disabled:translate-y-[3px] disabled:translate-x-[3px] disabled:cursor-not-allowed"
                            onClick={stopSimulation}
                            type="button"
                            title="Stop simulation and clear active packets"
                            disabled={!isPlaying && !isPaused && !isSingleCycle}
                        >"""
                        
content = content.replace(stop_find, stop_replace)


with open("apps/web/components/canvas/architecture-canvas.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated buttons")
