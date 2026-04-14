import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const result = await prisma.diagnosticResult.findUnique({
      where: { id },
    });

    if (!result) {
      return NextResponse.json(
        { error: "Result not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      {
        result_id: result.id,
        diagnostic: result.diagnosticJson,
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("Result fetch error:", error);

    return NextResponse.json(
      { error: "Server error while fetching result" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
