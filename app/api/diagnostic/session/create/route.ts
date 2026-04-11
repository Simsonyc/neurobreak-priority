import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/db/client";
import { createSessionSchema } from "@/lib/validation/createSession.schema";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createSessionSchema.parse(body);

    const session = await prisma.diagnosticSession.create({
      data: {
        firstName: parsed.first_name,
        email: parsed.email,
        profilSelected: parsed.profil_selected,
        status: "created",
        messages: [],
      },
    });

    return NextResponse.json({ session_id: session.id }, { status: 201 });
  } catch (error) {
    console.error("Session creation error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid payload",
          details: error.flatten(),
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Unknown server error" },
      { status: 500 }
    );
  }
}