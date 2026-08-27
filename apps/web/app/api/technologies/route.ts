import { NextResponse } from "next/server";
import { technologyLibrary } from "@architecture-studio/shared";

export async function GET() {
  // Simulate an external fetch or database query that can update technologies dynamically over time.
  // We default to the shared static library here, but this endpoint allows the client to fetch updates.
  return NextResponse.json(technologyLibrary);
}
