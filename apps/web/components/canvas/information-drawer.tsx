"use client";

import { X, ExternalLink, Activity, Shield, Cpu, ThumbsUp, ThumbsDown, GitCompare, BookOpen } from "lucide-react";
import type { TechnologyDefinition, ProtocolDefinition } from "@architecture-studio/shared";
import { getTechnologyInfo } from "@architecture-studio/shared";

type InfoPanelProps = {
  data: TechnologyDefinition | ProtocolDefinition;
  onClose: () => void;
};

export function InformationDrawer({ data, onClose }: InfoPanelProps) {
  const isProtocol = "transport" in data;
  
  const techInfo = !isProtocol 
    ? getTechnologyInfo(data.id, data.category, data.label) 
    : null;

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all p-4"
      onPointerDown={onClose}
    >
      <div 
        className="w-full max-w-2xl max-h-[85vh] bg-[#fffdf5] border-[3px] border-[#161616] shadow-[12px_12px_0_#161616] flex flex-col animate-in zoom-in-95 duration-200"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-[3px] border-[#161616] p-4 bg-[#ffde59]">
          <div>
            <h2 className="font-black uppercase tracking-wider text-xl">{data.label}</h2>
            <span className="text-[10px] font-black bg-white px-2 py-0.5 border-[2px] border-[#161616] uppercase inline-block mt-1">
              {data.category}
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="neo-button p-2 hover:bg-white bg-white/50"
            title="Close Information"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {/* Overview */}
          <div className="mb-8">
            <h3 className="font-black uppercase text-sm border-b-[3px] border-[#161616] pb-1 mb-3 flex items-center gap-2">
              <BookOpen size={18} strokeWidth={3} className="text-[#ff4fa3]" />
              Overview
            </h3>
            <p className="text-sm font-bold text-gray-800 leading-relaxed">
              {isProtocol ? (data as ProtocolDefinition).overview : techInfo?.overview}
            </p>
          </div>

          {/* Protocol Specific: Transport & Communication */}
          {isProtocol && (
            <div className="mb-8 grid grid-cols-2 gap-4">
              <div className="border-[3px] border-[#161616] p-3 bg-white shadow-[4px_4px_0_#161616]">
                <div className="text-[10px] uppercase font-black text-gray-500 mb-1">Transport</div>
                <div className="text-sm font-bold">{(data as ProtocolDefinition).transport}</div>
              </div>
              <div className="border-[3px] border-[#161616] p-3 bg-white shadow-[4px_4px_0_#161616]">
                <div className="text-[10px] uppercase font-black text-gray-500 mb-1">Comm Style</div>
                <div className="text-sm font-bold">{(data as ProtocolDefinition).communicationStyle}</div>
              </div>
            </div>
          )}

          {/* How It Works (Tech only) */}
          {!isProtocol && techInfo?.howItWorks && (
            <div className="mb-8">
              <h3 className="font-black uppercase text-sm border-b-[3px] border-[#161616] pb-1 mb-3 flex items-center gap-2">
                <Cpu size={18} strokeWidth={3} className="text-[#5de2e7]" />
                How It Works
              </h3>
              <p className="text-sm font-bold text-gray-800 leading-relaxed">{techInfo.howItWorks}</p>
            </div>
          )}

          {/* Use Cases */}
          <div className="mb-8">
            <h3 className="font-black uppercase text-sm border-b-[3px] border-[#161616] pb-1 mb-3 flex items-center gap-2">
              <ExternalLink size={18} strokeWidth={3} className="text-[#a18cff]" />
              Best Used For
            </h3>
            <ul className="list-disc pl-5 text-sm font-bold text-gray-800 space-y-1">
              {(isProtocol ? (data as ProtocolDefinition).useCases : techInfo?.useCases)?.map((uc, i) => (
                <li key={i}>{uc}</li>
              ))}
            </ul>
          </div>

          {/* Pros & Cons */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="border-[3px] border-[#161616] p-4 bg-[#9cf57a]/20 shadow-[6px_6px_0_#161616]">
              <h3 className="font-black uppercase text-sm border-b-[2px] border-[#161616] pb-1 mb-3 flex items-center gap-2">
                <ThumbsUp size={18} strokeWidth={3} className="text-green-600" />
                Advantages
              </h3>
              <ul className="list-disc pl-5 text-sm font-bold text-gray-800 space-y-1">
                {(isProtocol ? (data as ProtocolDefinition).advantages : techInfo?.advantages)?.map((adv, i) => (
                  <li key={i}>{adv}</li>
                ))}
              </ul>
            </div>
            
            <div className="border-[3px] border-[#161616] p-4 bg-[#ff6b6b]/10 shadow-[6px_6px_0_#161616]">
              <h3 className="font-black uppercase text-sm border-b-[2px] border-[#161616] pb-1 mb-3 flex items-center gap-2">
                <ThumbsDown size={18} strokeWidth={3} className="text-red-500" />
                Tradeoffs
              </h3>
              <ul className="list-disc pl-5 text-sm font-bold text-gray-800 space-y-1">
                {(isProtocol ? (data as ProtocolDefinition).disadvantages : techInfo?.disadvantages)?.map((dis, i) => (
                  <li key={i}>{dis}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Performance & Security */}
          <div className="mb-8">
            {(!isProtocol && techInfo?.performance) && (
              <div className="mb-5 border-l-[4px] border-[#5de2e7] pl-3 py-1">
                <div className="text-xs uppercase font-black text-gray-500 flex items-center gap-1 mb-1">
                  <Activity size={14} strokeWidth={3} /> Performance Notes
                </div>
                <div className="text-sm font-bold text-gray-800">{techInfo.performance}</div>
              </div>
            )}
            
            <div className="border-l-[4px] border-[#ffde59] pl-3 py-1">
              <div className="text-xs uppercase font-black text-gray-500 flex items-center gap-1 mb-1">
                <Shield size={14} strokeWidth={3} /> Security Considerations
              </div>
              <div className="text-sm font-bold text-gray-800">
                {isProtocol ? (data as ProtocolDefinition).security : techInfo?.security}
              </div>
            </div>
          </div>

          {/* Alternatives */}
          <div className="mb-4">
            <h3 className="font-black uppercase text-sm border-b-[3px] border-[#161616] pb-1 mb-3 flex items-center gap-2">
              <GitCompare size={18} strokeWidth={3} className="text-gray-600" />
              {isProtocol ? 'Related Protocols' : 'Alternatives'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {(isProtocol ? (data as ProtocolDefinition).relatedProtocols : techInfo?.alternatives)?.map((alt, i) => (
                <span key={i} className="text-xs font-black uppercase bg-gray-200 border-[2px] border-[#161616] px-2 py-1">
                  {alt}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
