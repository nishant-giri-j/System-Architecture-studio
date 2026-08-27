import { generatedTechData } from "./tech-data";
export interface TechnologyInfo {
  overview: string;
  howItWorks: string;
  useCases: string[];
  advantages: string[];
  disadvantages: string[];
  performance: string;
  security: string;
  alternatives: string[];
}

export const curatedTechnologyInfo: Record<string, TechnologyInfo> = {
  "redis-cache": {
    overview: "Redis is an open source, in-memory data structure store used as a database, cache, message broker, and streaming engine.",
    howItWorks: "It stores all data in RAM rather than on a disk, allowing for blazing fast read and write operations. It periodically snapshots data to disk for persistence.",
    useCases: ["Database caching", "Session storage", "Rate limiting", "Leaderboards", "Pub/Sub messaging"],
    advantages: ["Sub-millisecond latency", "Rich data structures (Hashes, Sets, Sorted Sets)", "Simple commands", "High throughput"],
    disadvantages: ["Dataset size is limited to available RAM", "Single-threaded architecture limits vertical scaling", "Persistence tradeoffs between performance and durability"],
    performance: "Typically 1-2ms latency. Capable of millions of ops/sec per node.",
    security: "Supports TLS and ACLs. Often deployed in private subnets with no public access.",
    alternatives: ["Memcached", "KeyDB", "Valkey", "Hazelcast"]
  },
  "postgres": {
    overview: "PostgreSQL is a highly stable, open-source object-relational database management system with over 35 years of active development.",
    howItWorks: "It uses a client/server model with a multi-process architecture. It guarantees ACID compliance through Write-Ahead Logging (WAL) and Multiversion Concurrency Control (MVCC).",
    useCases: ["Primary system of record", "Financial systems", "Geospatial applications (PostGIS)", "Data warehousing"],
    advantages: ["Extremely reliable and ACID compliant", "Advanced SQL features (CTEs, Window Functions)", "Excellent JSON/JSONB support", "Massive extension ecosystem"],
    disadvantages: ["High connection overhead requires pooling (pgBouncer)", "Vacuuming process can cause performance issues if untuned", "Active/Active multi-master scaling is complex"],
    performance: "Highly optimized for complex queries. Latency heavily depends on indexing and IOPS. Connection pooling is critical.",
    security: "Granular RBAC, Row-Level Security, TLS, SCRAM-SHA-256 password authentication.",
    alternatives: ["MySQL", "MariaDB", "Oracle", "SQL Server"]
  },
  "api-gateway": {
    overview: "An API Gateway is a server that acts as an API front-end, receiving API requests, enforcing throttling and security policies, passing requests to the back-end service, and then passing the response back to the requester.",
    howItWorks: "It acts as a reverse proxy, intercepting all incoming client requests. It performs cross-cutting concerns like auth, routing, and rate limiting before forwarding the request to internal microservices.",
    useCases: ["Microservices entry point", "API Monetization", "Legacy system strangulation", "Unified auth layer"],
    advantages: ["Decouples clients from microservices", "Centralized security and rate limiting", "Protocol translation (e.g., HTTP to gRPC)"],
    disadvantages: ["Can become a single point of failure", "Adds a network hop (latency)", "Configuration complexity"],
    performance: "Typically adds 2-10ms of latency. Requires high-throughput network configuration.",
    security: "Terminates TLS, validates JWTs, enforces WAF rules, provides DDoS protection.",
    alternatives: ["Kong", "AWS API Gateway", "Apigee", "Traefik", "NGINX"]
  },
  "kafka": {
    overview: "Apache Kafka is a distributed event streaming platform capable of handling trillions of events a day.",
    howItWorks: "Producers publish events to topics. Topics are partitioned across brokers. Consumers subscribe to topics and read events sequentially from a designated offset.",
    useCases: ["Event sourcing", "Log aggregation", "Real-time analytics", "Microservices decoupling"],
    advantages: ["Massive throughput", "Persistent storage of events", "Highly available and fault-tolerant", "Consumer decoupling"],
    disadvantages: ["Complex to manage and operate", "Requires ZooKeeper or KRaft", "Steep learning curve"],
    performance: "Optimized for high-throughput batching. Sequential disk I/O allows millions of msgs/sec.",
    security: "mTLS, SASL/SCRAM auth, ACLs for topic-level access control.",
    alternatives: ["RabbitMQ", "AWS Kinesis", "Apache Pulsar", "Google Pub/Sub"]
  }
};

export function getTechnologyInfo(techId: string, category: string, label: string): TechnologyInfo {
  if (curatedTechnologyInfo[techId]) {
    return curatedTechnologyInfo[techId];
  }
  
  if (generatedTechData[techId]) {
    return generatedTechData[techId];
  }

  return {
    overview: `A ${category} component providing ${label} capabilities to the architecture.`,
    howItWorks: `Operates as a standard ${category} layer element, interacting with upstream and downstream components via defined protocols.`,
    useCases: [`Typical ${category} scenarios`, `Enterprise ${label} deployments`],
    advantages: ["Purpose-built for its category", "Industry standard adoption"],
    disadvantages: ["May introduce architectural complexity", "Requires operational maintenance"],
    performance: "Performance characteristics vary based on infrastructure provisioning and load.",
    security: "Follows standard security practices for its deployment environment.",
    alternatives: ["Various cloud-native or open-source equivalents"]
  };
}
