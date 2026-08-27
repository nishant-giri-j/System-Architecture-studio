import json

techs = [
    "client", "network", "service", "data", "cache", "messaging", "storage", "compute", "security", "observability", "default", "web-client", "mobile-app", "desktop-app", "iot-device", "cli-tool", "smart-tv", "wearable", "kiosk", "third-party", "b2b-partner", "load-balancer", "api-gateway", "reverse-proxy", "cdn", "dns-server", "firewall", "service-mesh", "vpn-gateway", "vpc", "nat-gateway", "router-switch", "api-management", "service-discovery", "global-accelerator", "cloud-network", "api-service", "microservice", "grpc-service", "graphql-server", "websocket-server", "serverless-function", "worker-service", "cron-scheduler", "bff", "edge-function", "workflow-engine", "wasm-runtime", "auth-service", "notification-service", "search-service", "ml-inference", "llm-provider", "payment-gateway", "video-transcoder", "docker-container", "k8s-pod", "batch-processor", "nextjs-app", "spring-boot-service", "container-service", "api-rate-limiter", "postgresql", "mysql", "sql-server", "oracle-db", "mongodb", "dynamodb", "cassandra", "elasticsearch", "neo4j", "clickhouse", "sqlite", "redis-db", "cockroachdb", "timescaledb", "influxdb", "snowflake", "bigquery", "redshift", "cosmosdb", "firebase", "supabase", "couchbase", "planetscale", "turso", "pinecone", "weaviate", "yugabytedb", "tidb", "neon", "duckdb", "qdrant", "milvus", "supabase-storage", "event-queue", "kafka", "rabbitmq", "nats", "sqs", "sns", "pubsub", "redis-streams", "kinesis", "eventbridge", "activemq", "pulsar", "zeromq", "redpanda", "temporal", "azure-service-bus", "mosquitto", "redisson", "redis", "memcached", "cdn-cache", "varnish", "hazelcast", "keydb", "cloudflare-kv", "dragonfly", "valkey", "object-storage", "block-storage", "file-storage", "nas-san", "hdfs", "archive-storage", "google-cloud-storage", "azure-blob", "minio", "ceph", "datadog", "new-relic", "grafana", "prometheus", "kibana", "splunk", "opentelemetry", "jaeger", "grafana-loki", "grafana-tempo", "opensearch", "fluent-bit", "iam", "active-directory", "keycloak", "auth0", "hashicorp-vault", "ory-hydra", "zitadel", "spiffe-spire", "boundary-vpc", "boundary-public", "boundary-private", "boundary-k8s", "boundary-region", "boundary-az"
]

know = {
    "postgresql": {"desc": "An advanced, enterprise-class open-source relational database supporting both SQL and JSON querying.", "how": "Stores data in tables with rigid schemas using MVCC for concurrent access.", "use": ["Transactional systems", "Data warehousing", "Geospatial data (PostGIS)"]},
    "redis": {"desc": "An open-source, in-memory data structure store, used as a database, cache, and message broker.", "how": "Keeps all data in RAM for extremely low-latency reads and writes.", "use": ["Caching", "Session management", "Leaderboards"]},
    "kafka": {"desc": "A distributed event streaming platform for high-performance data pipelines, streaming analytics, and data integration.", "how": "Writes events to append-only logs partitioned across brokers.", "use": ["Event sourcing", "Log aggregation", "Microservice decoupling"]},
    "mongodb": {"desc": "A source-available cross-platform document-oriented database program classified as a NoSQL database.", "how": "Stores data in flexible, JSON-like documents with dynamic schemas.", "use": ["Content management", "Catalogs", "Real-time analytics"]},
    "elasticsearch": {"desc": "A distributed, RESTful search and analytics engine capable of addressing a growing number of use cases.", "how": "Indexes JSON documents using Apache Lucene for full-text search.", "use": ["Log analysis", "Full-text search", "Application search"]},
    "nextjs-app": {"desc": "A React framework that gives you building blocks to create web applications with server-side rendering and static generation.", "how": "Builds React components on the server (SSR) or at build time (SSG) before sending to the client.", "use": ["E-commerce", "SEO-heavy apps", "Dashboards"]},
    "api-gateway": {"desc": "An API management tool that sits between a client and a collection of backend services.", "how": "Acts as a reverse proxy, accepting all API calls, routing them, and returning the result.", "use": ["Rate limiting", "Authentication", "Request routing"]},
    "docker-container": {"desc": "A standardized unit of software that packages up code and all its dependencies.", "how": "Uses OS-level virtualization to deliver software in isolated packages.", "use": ["Microservices", "Consistent dev environments", "CI/CD pipelines"]}
}

def generate_tech_entry(name):
    if name in know:
        return {
            "overview": know[name]["desc"],
            "howItWorks": know[name]["how"],
            "useCases": know[name]["use"],
            "advantages": ["Industry standard", "Huge community support", "Highly scalable"],
            "disadvantages": ["Requires management overhead", "Can be overkill for simple setups"],
            "performance": "Highly dependent on hardware, but extremely fast in production setups.",
            "security": "Supports standard RBAC, network isolation, and encryption.",
            "alternatives": ["Alternative solutions exist based on cloud provider"]
        }
    else:
        is_db = any(x in name for x in ["db", "sql", "neo4j", "clickhouse", "cassandra", "firebase", "supabase", "pinecone", "milvus", "qdrant", "weaviate"])
        is_msg = any(x in name for x in ["kafka", "rabbitmq", "nats", "sqs", "sns", "pubsub", "kinesis", "activemq", "pulsar", "zeromq"])
        is_cache = any(x in name for x in ["cache", "redis", "memcached", "varnish", "hazelcast"])
        is_client = any(x in name for x in ["client", "app", "device", "wearable", "tv", "kiosk"])
        is_net = any(x in name for x in ["network", "gateway", "proxy", "balancer", "mesh", "vpc", "router", "dns", "cdn"])
        is_obs = any(x in name for x in ["datadog", "relic", "grafana", "prometheus", "kibana", "splunk", "telemetry", "jaeger", "fluent"])
        
        nice_name = name.replace("-", " ").title()
        
        if is_db:
            return {
                "overview": f"{nice_name} is a specialized database system optimized for specific data access patterns.",
                "howItWorks": "Stores and retrieves data using optimized indexing and storage engines tailored to its specific database model.",
                "useCases": [f"Persistent storage for {nice_name} data", "High-throughput querying", "Data analytics"],
                "advantages": [f"Optimized for {nice_name} workloads", "Scalable data storage"],
                "disadvantages": ["Operational complexity", "Data migration overhead"],
                "performance": "Designed for high throughput and efficient disk I/O.",
                "security": "Implements database-level authentication, role-based access, and data-at-rest encryption.",
                "alternatives": ["PostgreSQL", "MongoDB", "DynamoDB"]
            }
        elif is_msg:
            return {
                "overview": f"{nice_name} is a messaging system for asynchronous communication and event-driven architectures.",
                "howItWorks": "Receives messages from producers, queues or logs them, and routes them to subscribed consumers.",
                "useCases": ["Decoupling services", "Event streaming", "Task queuing"],
                "advantages": ["Asynchronous processing", "System resilience", "Load leveling"],
                "disadvantages": ["Introduces eventual consistency", "Message broker maintenance"],
                "performance": "Capable of handling thousands to millions of messages per second.",
                "security": "Secured via TLS and broker-level ACLs.",
                "alternatives": ["Kafka", "RabbitMQ", "SQS"]
            }
        elif is_net:
            return {
                "overview": f"{nice_name} manages, routes, and secures network traffic between clients and backend services.",
                "howItWorks": "Inspects incoming network packets or HTTP requests and routes them to the appropriate destination based on rules.",
                "useCases": ["Traffic routing", "Load balancing", "Network security boundary"],
                "advantages": ["Centralized traffic management", "Improves overall system security", "Traffic observability"],
                "disadvantages": ["Single point of failure if not highly available", "Adds a network hop (latency)"],
                "performance": "Highly optimized for extremely low latency per request.",
                "security": "Acts as the first line of defense, implementing WAF, DDoS protection, and TLS termination.",
                "alternatives": ["NGINX", "HAProxy", "AWS API Gateway"]
            }
        elif is_client:
            return {
                "overview": f"A {nice_name} represents the end-user interface or edge device consuming backend services.",
                "howItWorks": "Executes UI code locally on the user's device and makes API requests over the internet.",
                "useCases": ["User interaction", "Data presentation", "Local device processing"],
                "advantages": ["Rich user experience", "Offloads rendering from server"],
                "disadvantages": ["Unreliable network connections", "Varied hardware capabilities"],
                "performance": "Depends heavily on the user's hardware and local network speed.",
                "security": "Considered a zero-trust environment. Never trust client inputs directly.",
                "alternatives": ["Web browser", "Native application"]
            }
        elif is_obs:
            return {
                "overview": f"{nice_name} is an observability and monitoring tool for tracking system health and performance.",
                "howItWorks": "Collects logs, metrics, and traces from applications and visualizes them in dashboards.",
                "useCases": ["System monitoring", "Alerting", "Performance debugging"],
                "advantages": ["Deep visibility into system health", "Faster incident resolution"],
                "disadvantages": ["Can generate massive amounts of telemetry data", "Storage costs"],
                "performance": "Ingests high volumes of data asynchronously without blocking main apps.",
                "security": "Requires secure transmission of logs to prevent leaking PII.",
                "alternatives": ["Datadog", "Prometheus", "New Relic"]
            }
        else:
            return {
                "overview": f"The {nice_name} component provides specialized processing or capabilities to the architecture.",
                "howItWorks": "Executes specific business logic or infrastructure tasks within its domain.",
                "useCases": [f"Handling {nice_name} workloads", "System orchestration"],
                "advantages": ["Domain-specific optimizations", "Separation of concerns"],
                "disadvantages": ["Adds an additional component to manage"],
                "performance": "Scales horizontally depending on deployment architecture.",
                "security": "Operates within a secured VPC with service-to-service authentication.",
                "alternatives": ["Standard Microservice"]
            }

code = """export const generatedTechData: Record<string, any> = {
"""
for t in techs:
    entry = generate_tech_entry(t)
    code += f'  "{t}": {json.dumps(entry)},\n'
code += "};\n"

with open("packages/shared/src/tech-data.ts", "w", encoding="utf-8") as f:
    f.write(code)

print("Created tech-data.ts")
