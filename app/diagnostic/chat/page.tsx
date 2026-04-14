"use client";

import { Suspense } from "react";
import { ChatShell } from "@/components/diagnostic/ChatShell";

export default function DiagnosticChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatShell />
    </Suspense>
  );
}
