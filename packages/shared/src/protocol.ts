import { generatedProtocolData } from "./protocol-data";
export interface ProtocolDefinition {
  id: string;
  label: string;
  category: string;
  overview: string;
  transport: string;
  communicationStyle: string;
  useCases: string[];
  advantages: string[];
  disadvantages: string[];
  security: string;
  relatedProtocols: string[];
}

export const protocolLibrary: ProtocolDefinition[] = [
  {
    id: "REST",
    label: "REST",
    category: "HTTP",
    overview: "Representational State Transfer. A standard architectural style for building web APIs using standard HTTP methods.",
    transport: "HTTP/1.1 or HTTP/2",
    communicationStyle: "Request/Response (Synchronous)",
    useCases: ["Public APIs", "CRUD applications", "Web backends", "Mobile app backends"],
    advantages: ["Ubiquitous support", "Highly cacheable", "Stateless and scalable", "Human-readable payloads (JSON)"],
    disadvantages: ["Over-fetching / Under-fetching of data", "Requires multiple round-trips for complex data", "No built-in streaming"],
    security: "TLS (HTTPS), OAuth2, JWT, API Keys. Relies on HTTP security mechanisms.",
    relatedProtocols: ["GraphQL", "gRPC", "HTTP/3"]
  },
  {
    id: "GraphQL",
    label: "GraphQL",
    category: "HTTP",
    overview: "A query language for APIs that allows clients to request exactly the data they need and nothing more.",
    transport: "HTTP/1.1 or HTTP/2",
    communicationStyle: "Request/Response (Synchronous)",
    useCases: ["Complex data graphs", "Mobile apps with bandwidth constraints", "BFF (Backend for Frontend)"],
    advantages: ["No over-fetching", "Strongly typed schema", "Single endpoint for all queries"],
    disadvantages: ["Complex backend implementation", "Caching is difficult at the network level", "N+1 query problem"],
    security: "TLS, Query depth limiting, rate limiting based on query complexity.",
    relatedProtocols: ["REST", "Relay", "Apollo"]
  },
  {
    id: "gRPC",
    label: "gRPC",
    category: "RPC",
    overview: "A high-performance, open-source universal RPC framework created by Google.",
    transport: "HTTP/2",
    communicationStyle: "Request/Response, Unary, Server Streaming, Client Streaming, Bi-directional Streaming",
    useCases: ["Microservice-to-microservice communication", "Polyglot environments", "Low-latency systems"],
    advantages: ["Extremely fast (binary Protobuf)", "Strongly typed contracts", "Built-in streaming", "Code generation"],
    disadvantages: ["Hard to debug manually (binary)", "Requires HTTP/2 support end-to-end", "Poor native browser support"],
    security: "mTLS (Mutual TLS) is standard for service-to-service, ALTS.",
    relatedProtocols: ["Protocol Buffers", "Connect RPC", "Thrift"]
  },
  {
    id: "WebSocket",
    label: "WebSocket",
    category: "HTTP",
    overview: "A computer communications protocol providing full-duplex communication channels over a single TCP connection.",
    transport: "TCP",
    communicationStyle: "Bi-directional, Asynchronous, Event-driven",
    useCases: ["Chat applications", "Live sports updates", "Real-time gaming", "Collaborative editing"],
    advantages: ["Low latency", "Persistent connection", "Bi-directional push capabilities"],
    disadvantages: ["Stateful (harder to load balance)", "Connection limits on servers", "Does not natively support request/response multiplexing easily"],
    security: "WSS (TLS). Susceptible to Cross-Site WebSocket Hijacking (CSWSH).",
    relatedProtocols: ["Server-Sent Events (SSE)", "WebRTC", "Socket.IO"]
  },
  {
    id: "Kafka",
    label: "Kafka",
    category: "Messaging",
    overview: "A distributed event streaming platform used for high-performance data pipelines and streaming analytics.",
    transport: "TCP (Custom Binary Protocol)",
    communicationStyle: "Publish-Subscribe, Event Streaming, Asynchronous",
    useCases: ["Event sourcing", "Log aggregation", "Stream processing", "Decoupling microservices"],
    advantages: ["Extremely high throughput", "Persistent storage of events", "Scalable and fault-tolerant"],
    disadvantages: ["High operational complexity", "Requires ZooKeeper/KRaft", "Steep learning curve"],
    security: "SASL/SCRAM, mTLS, ACLs for topic-level authorization.",
    relatedProtocols: ["AMQP", "MQTT", "RabbitMQ"]
  },
  {
    id: "RabbitMQ",
    label: "RabbitMQ",
    category: "Messaging",
    overview: "A widely deployed open-source message broker that supports multiple messaging protocols.",
    transport: "TCP",
    communicationStyle: "Message Queue, Publish-Subscribe, Point-to-Point",
    useCases: ["Task queues", "Background job processing", "Complex routing topologies"],
    advantages: ["Flexible routing (Exchanges)", "Supports multiple protocols (AMQP, MQTT)", "Good admin UI"],
    disadvantages: ["Lower throughput than Kafka", "Scaling can be tricky (cluster partitions)"],
    security: "TLS, LDAP integration, Virtual Hosts isolation.",
    relatedProtocols: ["AMQP", "Kafka", "ActiveMQ"]
  },
  {
    id: "Redis (RESP)",
    label: "Redis (RESP)",
    category: "Database",
    overview: "An in-memory data structure store used as a database, cache, and message broker.",
    transport: "TCP (RESP - Redis Serialization Protocol)",
    communicationStyle: "Request/Response, Pub/Sub",
    useCases: ["Caching", "Session management", "Leaderboards", "Real-time analytics"],
    advantages: ["Sub-millisecond latency", "Rich data structures", "Simple to use"],
    disadvantages: ["Data must fit in memory", "Persistence has tradeoffs", "Single-threaded (mostly)"],
    security: "TLS, ACLs, AUTH command.",
    relatedProtocols: ["Memcached", "Valkey"]
  },
  {
    id: "SQL",
    label: "SQL",
    category: "Database",
    overview: "A standard protocol/language for accessing and manipulating relational databases.",
    transport: "TCP (Various Wire Protocols)",
    communicationStyle: "Request/Response, Streaming",
    useCases: ["Primary relational data store queries", "Data warehousing", "Transactions"],
    advantages: ["ACID compliant", "Extremely robust", "Advanced aggregations", "Huge ecosystem"],
    disadvantages: ["Connection overhead", "Horizontal write scaling is hard"],
    security: "TLS, Role-based access control (RBAC), Row-level security (RLS).",
    relatedProtocols: ["PostgreSQL", "MySQL", "JDBC"]
  }
];

export function getProtocolInfo(id: string): ProtocolDefinition {
  const existing = protocolLibrary.find(p => p.id === id || p.label === id);
  if (existing) return existing;
  
  if (generatedProtocolData[id]) {
    return {
      id,
      label: id,
      category: "Protocol",
      ...generatedProtocolData[id]
    };
  }

  return {
    id,
    label: id,
    category: "Protocol",
    overview: `The ${id} protocol facilitates specialized communication and data transfer between components in the architecture.`,
    transport: "Varies depending on implementation",
    communicationStyle: "Standard for the protocol type",
    useCases: ["System integration", "Data exchange", "Inter-process communication"],
    advantages: ["Provides standardized communication guarantees for its domain", "Industry recognized standard"],
    disadvantages: ["Requires specific driver, client library, or open port support", "May add parsing/serialization overhead"],
    security: "Depends on transport layer security (TLS/SSL) and authentication implementation.",
    relatedProtocols: []
  };
}
