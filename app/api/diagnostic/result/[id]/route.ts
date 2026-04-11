import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const result = await prisma.diagnosticResult.findUnique({
      where: { id },
    });

    if (!result) {
      return NextResponse.json(
        { error: "Result not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        result_id: result.id,
        diagnostic: result.diagnosticJson,
      },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Result fetch error:", error);

    return NextResponse.json(
      { error: "Server error while fetching result" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}