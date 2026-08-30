import { useState } from 'react';
import { X, Network, Save, Trash, Info, ChevronDown, Search } from 'lucide-react';
import type { EventFlowEdge, EventEdgeData } from './event-edge';
import { getProtocolInfo, type ProtocolDefinition } from '@architecture-studio/shared';

interface EdgePropertiesPanelProps {
  edge: EventFlowEdge;
  onSave: (id: string, data: Partial<EventEdgeData>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onShowProtocolInfo: (protocol: ProtocolDefinition) => void;
}

export function EdgePropertiesPanel({ edge, onSave, onDelete, onClose, onShowProtocolInfo }: EdgePropertiesPanelProps) {
  const [eventName, setEventName] = useState(edge.data?.event || "");
  const [protocol, setProtocol] = useState(edge.data?.protocol || "HTTP");
  const [edgeStyle, setEdgeStyle] = useState(edge.data?.edgeStyle || "bezier");
  const [isProtocolSelectorOpen, setIsProtocolSelectorOpen] = useState(false);
  const [protocolSearch, setProtocolSearch] = useState("");

  const protocolGroups = [
    { label: "Synchronous (Web/API)", options: ["HTTP", "HTTP/2", "HTTP/3", "REST", "GraphQL", "gRPC", "tRPC", "SOAP", "XML-RPC", "JSON-RPC", "Thrift", "OData", "Avro", "OpenAPI", "JSON:API", "gRPC-Web", "Connect RPC", "OAuth 2.0", "OIDC", "WebAuthn", "SOAP 1.2", "SAML", "CAS"] },
    { label: "Asynchronous (Events)", options: ["Kafka", "RabbitMQ", "AMQP", "MQTT", "MQTT 5", "SQS", "Webhook", "STOMP", "XMPP", "JMS", "NATS", "WebPush", "ZeroMQ", "Pulsar", "Celery", "SNS", "ActiveMQ", "RocketMQ", "IronMQ", "Kinesis", "EventBridge"] },
    { label: "Real-time / Streaming", options: ["WebSocket", "WebRTC", "SSE (Server-Sent Events)", "TCP", "UDP", "RTMP", "HLS", "MPEG-DASH", "WebTransport", "QUIC", "Socket.IO", "SignalR", "WebSockets (WSS)", "RTSP", "SRT"] },
    { label: "Data / Storage", options: ["SQL", "Redis (RESP)", "MongoDB Wire", "S3", "JDBC", "ODBC", "CQL", "Memcached", "Firebase", "GraphQL", "Elasticsearch (HTTP)", "Cassandra CQL", "Neo4j Bolt", "Gremlin", "DynamoDB API", "CosmosDB API", "HDFS", "NFS", "SMB/CIFS", "iSCSI"] },
    { label: "Network / Infra", options: ["IP", "IPv4", "IPv6", "ICMP", "DNS", "BGP", "TLS", "SSL", "IPsec", "MAC", "ARP", "DHCP", "SNMP", "VLAN", "VXLAN", "WireGuard", "OpenVPN", "IKEv2", "L2TP", "PPTP"] },
    { label: "Other / Application", options: ["FTP", "SFTP", "FTPS", "SMTP", "POP3", "IMAP", "SSH", "Telnet", "LDAP", "Internal", "IPC", "gopher", "BitTorrent", "IPFS", "ActivityPub", "Matrix", "SIP", "VoIP"] }
  ];

  const filteredGroups = protocolGroups.map(group => ({
    ...group,
    options: group.options.filter(opt => opt.toLowerCase().includes(protocolSearch.toLowerCase()))
  })).filter(group => group.options.length > 0);

  return (
    <>
      <div 
        className="fixed inset-0 z-[99998] flex items-center justify-center bg-black/20 backdrop-blur-sm"
        onPointerDown={onClose}
      >
        <div 
          className="neo-panel w-[400px] bg-white flex flex-col shadow-[12px_12px_0_#161616]"
          onPointerDown={e => e.stopPropagation()}
        >
          <div className="border-b-[3px] border-[#161616] bg-[#ffde59] px-4 py-3 flex justify-between items-center">
            <h2 className="m-0 text-sm font-black uppercase tracking-wide flex items-center gap-2">
              <Network className="w-5 h-5"/> Wire Settings
            </h2>
            <button onClick={onClose} className="hover:bg-black/10 p-1 rounded-sm transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-5 flex flex-col gap-5">
            <div>
              <label className="block text-[11px] font-black uppercase text-gray-600 mb-2">Event Name</label>
              <input 
                autoFocus
                value={eventName}
                onChange={e => setEventName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && onSave(edge.id, { event: eventName, protocol, edgeStyle })}
                className="w-full text-sm py-2 px-3 bg-white border-[3px] border-[#161616] focus:bg-[#ffde59] outline-none transition-all placeholder-gray-400 font-bold"
                placeholder="e.g. process payment"
              />
            </div>
            
            <div>
              <label className="block text-[11px] font-black uppercase text-gray-600 mb-2">Protocol / Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsProtocolSelectorOpen(true)}
                  className="w-full text-left text-sm py-2 px-3 bg-white border-[3px] border-[#161616] hover:bg-[#ffde59] outline-none transition-all font-bold flex justify-between items-center"
                >
                  <span className="truncate">{protocol}</span>
                  <ChevronDown className="w-4 h-4 shrink-0 ml-2" strokeWidth={3} />
                </button>

                <button 
                  onClick={() => onShowProtocolInfo(getProtocolInfo(protocol))}
                  className="flex items-center justify-center bg-white border-[3px] border-[#161616] w-10 shrink-0 hover:bg-[#ffde59] transition-colors"
                  title="View Protocol Details"
                >
                  <Info className="w-5 h-5 text-[#161616]" strokeWidth={3} />
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-[11px] font-black uppercase text-gray-600 mb-2">Wire Style</label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                  <input 
                    type="radio" 
                    checked={edgeStyle === "bezier"} 
                    onChange={() => setEdgeStyle("bezier")}
                    className="w-4 h-4 accent-black"
                  /> 
                  Curved (Bezier)
                </label>
                <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                  <input 
                    type="radio" 
                    checked={edgeStyle === "straight"} 
                    onChange={() => setEdgeStyle("straight")}
                    className="w-4 h-4 accent-black"
                  /> 
                  Straight Line
                </label>
                <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                  <input 
                    type="radio" 
                    checked={edgeStyle === "step"} 
                    onChange={() => setEdgeStyle("step")}
                    className="w-4 h-4 accent-black"
                  /> 
                  Angled (Step)
                </label>
                <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                  <input 
                    type="radio" 
                    checked={edgeStyle === "smoothstep"} 
                    onChange={() => setEdgeStyle("smoothstep")}
                    className="w-4 h-4 accent-black"
                  /> 
                  Rounded Step
                </label>
              </div>
            </div>
          </div>

          <div className="border-t-[3px] border-[#161616] bg-gray-50 px-4 py-3 flex gap-3">
            <button 
              onClick={() => {
                onSave(edge.id, { event: eventName, protocol, edgeStyle });
                onClose();
              }}
              className="flex-1 neo-button bg-[#5de2e7] hover:bg-[#4bcad0] py-2 flex items-center justify-center gap-2 text-sm font-black tracking-wide"
            >
              <Save className="w-4 h-4" strokeWidth={3}/> SAVE CHANGES
            </button>
            
            <button 
              onClick={() => {
                onDelete(edge.id);
                onClose();
              }}
              className="neo-button bg-[#ff6b6b] hover:bg-[#e85b5b] px-4 flex items-center justify-center text-white"
              title="Delete Wire"
            >
              <Trash className="w-4 h-4" strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>

      {isProtocolSelectorOpen && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onPointerDown={() => setIsProtocolSelectorOpen(false)}
        >
          <div 
            className="neo-panel w-full max-w-2xl bg-white flex flex-col shadow-[12px_12px_0_#161616] max-h-[85vh]"
            onPointerDown={e => e.stopPropagation()}
          >
            <div className="border-b-[3px] border-[#161616] bg-[#ffde59] p-4 flex justify-between items-center">
              <h3 className="font-black uppercase text-lg flex items-center gap-2">
                <Network className="w-5 h-5" strokeWidth={3} /> Select Protocol
              </h3>
              <button 
                onClick={() => setIsProtocolSelectorOpen(false)} 
                className="hover:bg-black/10 p-1 transition-colors border-[2px] border-transparent hover:border-[#161616]"
              >
                <X size={20} strokeWidth={3} />
              </button>
            </div>
            
            <div className="p-4 border-b-[3px] border-[#161616] bg-[#f8f9fa]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={3} />
                <input
                  autoFocus
                  value={protocolSearch}
                  onChange={e => setProtocolSearch(e.target.value)}
                  className="w-full neo-input pl-10 pr-4 py-3 text-sm font-bold bg-white focus:bg-[#ffde59] transition-colors"
                  placeholder="Search over 100+ protocols..."
                />
              </div>
            </div>
            
            <div className="overflow-y-auto p-4 custom-scrollbar bg-white">
              <div className="flex flex-col gap-6">
                {filteredGroups.map(group => (
                  <div key={group.label}>
                    <div className="text-xs font-black uppercase text-gray-500 mb-3 flex items-center gap-2">
                      <div className="h-0.5 flex-1 bg-gray-200"></div>
                      {group.label}
                      <div className="h-0.5 flex-1 bg-gray-200"></div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-wrap">
                      {group.options.map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setProtocol(opt);
                            setIsProtocolSelectorOpen(false);
                            setProtocolSearch("");
                          }}
                          className={`neo-button text-left px-3 py-2 text-xs font-bold transition-transform hover:-translate-y-0.5 hover:translate-x-0.5 ${
                            protocol === opt 
                              ? 'bg-[#161616] text-white shadow-[2px_2px_0_#ffde59]' 
                              : 'bg-white hover:bg-[#5de2e7] shadow-[2px_2px_0_#161616]'
                          }`}
                        >
                          <span className="truncate block">{opt}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                
                {filteredGroups.length === 0 && (
                  <div className="py-10 flex flex-col items-center justify-center text-gray-400">
                    <Search className="w-10 h-10 mb-2 opacity-50" />
                    <p className="font-black uppercase text-sm">No protocols found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

