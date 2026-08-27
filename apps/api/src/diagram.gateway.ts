import { WebSocketGateway } from "@nestjs/websockets";

/** Reserved for collaborative cursors and shared simulation events in Phase 3. */
@WebSocketGateway({ cors: { origin: true } })
export class DiagramGateway {}
