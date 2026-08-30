import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { AiNewTechnology, AiNewProtocol } from "@architecture-studio/shared";

// ── Resolve paths to the shared package source files ──────────
// In development, the API route runs from apps/web, so we navigate
// up to the monorepo root and into packages/shared/src.
const SHARED_SRC = path.resolve(process.cwd(), "..", "..", "packages", "shared", "src");
const TECH_DATA_PATH = path.join(SHARED_SRC, "tech-data.ts");
const PROTOCOL_DATA_PATH = path.join(SHARED_SRC, "protocol-data.ts");
const TECHNOLOGY_PATH = path.join(SHARED_SRC, "technology.ts");

/**
 * Append a new entry to generatedTechData in tech-data.ts.
 * Each entry is a single-line JSON value keyed by the tech id.
 */
function appendTechData(tech: AiNewTechnology): void {
    let content = fs.readFileSync(TECH_DATA_PATH, "utf-8");

    // Check if already exists
    if (content.includes(`"${tech.id}":`)) return;

    const entry = `  "${tech.id}": ${JSON.stringify(tech.info)},`;

    // Insert before the closing `};`
    const closingIndex = content.lastIndexOf("};");
    if (closingIndex === -1) return;

    content =
        content.slice(0, closingIndex) + entry + "\n" + content.slice(closingIndex);

    fs.writeFileSync(TECH_DATA_PATH, content, "utf-8");
}

/**
 * Append a new TechnologyDefinition to the technologyLibrary array in technology.ts.
 */
function appendTechnologyLibrary(tech: AiNewTechnology): void {
    let content = fs.readFileSync(TECHNOLOGY_PATH, "utf-8");

    // Check if this tech id already exists in the library
    if (content.includes(`"id": "${tech.id}"`)) return;

    const newDef = `    {
    "id": "${tech.id}",
    "label": "${tech.label}",
    "category": "${tech.category}",
    "color": "${tech.color}",
    "description": "${tech.description.replace(/"/g, '\\"')}"
},`;

    // Find the closing `];` of the technologyLibrary array.
    // We look for the pattern that ends the array, just before the registry helpers.
    const arrayEndPattern = /\n\];\s*\n\n\/\/ ── Registry helpers/;
    const match = content.match(arrayEndPattern);

    if (match && match.index !== undefined) {
        content =
            content.slice(0, match.index) +
            "\n" +
            newDef +
            content.slice(match.index);
    }

    fs.writeFileSync(TECHNOLOGY_PATH, content, "utf-8");
}

/**
 * Append a new entry to generatedProtocolData in protocol-data.ts.
 */
function appendProtocolData(protocol: AiNewProtocol): void {
    let content = fs.readFileSync(PROTOCOL_DATA_PATH, "utf-8");

    // Check if already exists
    if (content.includes(`"${protocol.id}":`)) return;

    const data = {
        overview: protocol.overview,
        transport: protocol.transport,
        communicationStyle: protocol.communicationStyle,
        useCases: protocol.useCases,
        advantages: protocol.advantages,
        disadvantages: protocol.disadvantages,
        security: protocol.security,
        relatedProtocols: protocol.relatedProtocols,
    };

    const entry = `  "${protocol.id}": ${JSON.stringify(data)},`;

    // Insert before the closing `};`
    const closingIndex = content.lastIndexOf("};");
    if (closingIndex === -1) return;

    content =
        content.slice(0, closingIndex) + entry + "\n" + content.slice(closingIndex);

    fs.writeFileSync(PROTOCOL_DATA_PATH, content, "utf-8");
}

export async function POST(request: Request) {
    try {
        const {
            technologies,
            protocols,
        }: {
            technologies: AiNewTechnology[];
            protocols: AiNewProtocol[];
        } = await request.json();

        const results = {
            technologiesSaved: 0,
            protocolsSaved: 0,
            errors: [] as string[],
        };

        // Persist new technologies
        for (const tech of technologies ?? []) {
            try {
                appendTechData(tech);
                appendTechnologyLibrary(tech);
                results.technologiesSaved++;
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                results.errors.push(`Failed to save tech "${tech.id}": ${msg}`);
            }
        }

        // Persist new protocols
        for (const protocol of protocols ?? []) {
            try {
                appendProtocolData(protocol);
                results.protocolsSaved++;
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                results.errors.push(
                    `Failed to save protocol "${protocol.id}": ${msg}`,
                );
            }
        }

        return NextResponse.json(results);
    } catch (error: unknown) {
        console.error("Library persistence failed:", error);
        const message =
            error instanceof Error ? error.message : "Unknown error occurred";
        return NextResponse.json(
            { error: `Persistence failed: ${message}` },
            { status: 500 },
        );
    }
}
