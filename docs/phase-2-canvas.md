# Phase 2 — React Flow Canvas Foundation

## 1. Install and start the workspace

From the repository root:

```bash
pnpm install
pnpm dev
```

The Next.js canvas opens at `http://localhost:3000`; the NestJS GraphQL endpoint is `http://localhost:4000/graphql`.

## 2. Start with a typed diagram contract

`packages/shared/src/diagram.ts` defines the serializable graph shape. Every node keeps an ID, a canvas position, a fixed node type, and technology-driven visual data. Every edge owns the direction and an event payload. Keeping this contract outside the web app prevents the eventual API and canvas models from drifting apart.

The current technology catalogue is in `packages/shared/src/technology.ts`. Add a new item there to make it available in the palette. A database-backed catalogue can use this exact shape in Phase 3.

## 3. Render React Flow once at the page boundary

`apps/web/app/globals.css` imports React Flow's base stylesheet. `apps/web/app/page.tsx` renders the client-only `ArchitectureCanvas` component. The canvas owns `nodes` and `edges` through React Flow's `useNodesState` and `useEdgesState` hooks.

## 4. Create the Neo-Brutalist node

`components/canvas/architecture-node.tsx` registers the `architecture` node. It deliberately uses thick black borders, hard black drop shadows, flat colours, bold type, and coloured connection handles. Its `data.technologyId` chooses the icon, so the data model—not a UI conditional elsewhere—determines a node's visual identity.

## 5. Add the library drag-and-drop flow

`components/canvas/tech-palette.tsx` serializes an item from the shared technology library into a custom drag MIME type. `ArchitectureCanvas.onDrop` reads that item, converts pointer coordinates with `screenToFlowPosition`, and appends a correctly typed `architecture` node. This is the seam where a dynamic API-backed library will later feed the UI.

## 6. Define and play directional events

Draw from a pink right-side source handle to a yellow left-side target handle. `onConnect` adds a directed `event` edge with a default event name. Click an edge and use the Event editor to name the message.

`components/canvas/event-edge.tsx` draws the arrow, its label, and—in Play mode—a travelling SVG pulse. The Play button only switches `data.playing` on existing edges, so the stored graph remains pure data without timers or DOM state.

## 7. Validate and deploy

Run:

```bash
pnpm typecheck
pnpm build
```

For Vercel, import the repository and set the project Root Directory to `apps/web`. For Render, use `render.yaml`, set `CORS_ORIGIN` to the deployed Vercel URL, and deploy the API service.

> This phase stores a working graph in browser local storage for refresh recovery. Do not treat it as a project-saving implementation; Phase 3 will replace that boundary with authenticated GraphQL persistence and PostgreSQL/Prisma.
