"use client";

import { useContext, useState } from "react";
import type { TechnologyDefinition } from "@architecture-studio/shared";
import { Database, HardDrive, MonitorSmartphone, Network, Server, Zap, ChevronDown, ChevronRight, Folder, Search, Shield, Activity, Box, Lock, SquareDashed, Info } from "lucide-react";
import { TechContext } from "./tech-context";

export const DND_MIME = "application/architecture-technology";

const iconByCategory: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  client: MonitorSmartphone,
  network: Network,
  service: Server,
  data: Database,
  messaging: Zap,
  cache: HardDrive,
  storage: Box,
  observability: Activity,
  security: Shield,
  boundary: SquareDashed,
  compute: Server
};

function CategoryFolder({ category, items, defaultOpen = false, onShowInfo }: { category: string, items: TechnologyDefinition[], defaultOpen?: boolean, onShowInfo: (tech: TechnologyDefinition) => void }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b-[3px] border-[#161616] last:border-b-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between bg-[#ffde59] px-3 py-3 text-left font-black uppercase text-sm hover:bg-[#f0eed8] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Folder size={16} strokeWidth={3} />
          {category}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold bg-white px-2 py-0.5 border-[2px] border-[#161616] leading-none flex items-center justify-center">
            {items.length}
          </span>
          {isOpen ? <ChevronDown size={18} strokeWidth={3} /> : <ChevronRight size={18} strokeWidth={3} />}
        </div>
      </button>
      
      {isOpen && (
        <div className="grid grid-cols-2 gap-2 p-3 lg:grid-cols-1 bg-[#fffdf5] border-t-[3px] border-[#161616]">
          {items.map((technology) => {
            const Icon = iconByCategory[technology.category] ?? Server;
            return (
              <button
                key={technology.id}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "copy";
                  event.dataTransfer.setData(DND_MIME, JSON.stringify(technology));

                  // Create a highly visible custom drag ghost
                  const dragGhost = document.createElement("div");
                  dragGhost.style.border = "3px solid #161616";
                  dragGhost.style.backgroundColor = technology.color;
                  dragGhost.style.color = "#161616";
                  dragGhost.style.fontWeight = "900";
                  dragGhost.style.textTransform = "uppercase";
                  dragGhost.style.padding = "8px 16px";
                  dragGhost.style.boxShadow = "4px 4px 0 #161616";
                  dragGhost.style.position = "absolute";
                  dragGhost.style.top = "-1000px";
                  dragGhost.style.zIndex = "9999";
                  dragGhost.textContent = `+ Drop ${technology.label}`;
                  document.body.appendChild(dragGhost);
                  event.dataTransfer.setDragImage(dragGhost, 20, 20);

                  setTimeout(() => document.body.removeChild(dragGhost), 100);
                }}
                className="neo-button flex items-center gap-2 bg-white p-2 text-left"
                title={technology.description}
                type="button"
              >
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center border-2 border-[#161616]"
                  style={{ backgroundColor: technology.color }}
                >
                  <Icon size={18} strokeWidth={3} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-black uppercase">{technology.label}</span>
                </span>
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowInfo(technology);
                  }}
                  className="shrink-0 p-1 hover:bg-[#ffde59] transition-colors border-[2px] border-transparent hover:border-[#161616]"
                  title="View Details"
                >
                  <Info size={16} strokeWidth={3} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TechnologyPalette({ onShowInfo }: { onShowInfo: (tech: TechnologyDefinition) => void }) {
  const technologies = useContext(TechContext);
  const [search, setSearch] = useState("");

  const filteredTechs = technologies.filter(
    (t) =>
      t.label.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filteredTechs.reduce((acc, tech) => {
    if (!acc[tech.category]) acc[tech.category] = [];
    acc[tech.category]!.push(tech);
    return acc;
  }, {} as Record<string, TechnologyDefinition[]>);

  // Define an explicit order for categories
  const categoryOrder = ["boundary", "client", "network", "service", "data", "messaging", "cache", "storage", "compute", "observability", "security"];
  const sortedCategories = Object.entries(grouped).sort((a, b) => {
    const idxA = categoryOrder.indexOf(a[0]);
    const idxB = categoryOrder.indexOf(b[0]);
    return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
  });

  return (
    <aside className="neo-panel flex w-full shrink-0 flex-col overflow-hidden bg-white lg:w-72">
      <div className="border-b-[3px] border-[#161616] bg-[#ff4fa3] px-4 py-3 shrink-0">
        <h2 className="m-0 text-sm font-black uppercase tracking-wide">Tech Library</h2>
        <p className="m-0 mt-1 text-xs font-bold">Drag and drop to build.</p>
      </div>

      <div className="border-b-[3px] border-[#161616] bg-[#fffdf5] p-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-[#161616]" size={16} strokeWidth={3} />
          <input
            type="text"
            placeholder="Search technologies..."
            className="w-full border-[3px] border-[#161616] py-2 pl-8 pr-2 text-xs font-bold outline-none focus:bg-[#ffde59] placeholder:text-[#161616]/60 transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sortedCategories.length > 0 ? (
          sortedCategories.map(([category, items]) => (
            <CategoryFolder 
              key={category} 
              category={category} 
              items={items} 
              defaultOpen={search.length > 0} 
              onShowInfo={onShowInfo}
            />
          ))
        ) : (
          <div className="p-4 text-center text-xs font-bold text-[#161616]/60">
            No technologies found.
          </div>
        )}
      </div>
    </aside>
  );
}








