import { NextResponse } from "next/server";
import { getTechnologyLibrary } from "@architecture-studio/shared";

export async function GET() {
  // Return the runtime-updated technology library
  return NextResponse.json(getTechnologyLibrary());
}
