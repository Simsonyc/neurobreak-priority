"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type UiMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

type DiagnosticState = {
  enough_information: boolean;
  completion_score: number;
  covered_dimensions: string[];
  missing_dimensions: string[];
  dominant_signals: string[];
  emerging_priorities: string[];
  next_focus: string;
  reason_for_next_question: string;
};

type CreateSessionResponse = {
  session_id: string;
};

type ChatResponse = {
  assistant_message: string;
  diagnostic_state: DiagnosticState;
  should_finalize: boolean;
};

type FinalizeResponse = {
  result_id: string;
  diagnostic?: unknown;
  already_finalized?: boolean;
};

const PROFILE_OPTIONS = [
  { value: "entrepreneur", label: "Entrepreneur" },
  { value: "salarie", label: "Salarié" },
  { value: "independant", label: "Indépendant" },
  { value: "createur", label: "Créateur" },
] as const;

export function ChatShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const profilFromUrl = searchParams.get("profil") as "entrepreneur" | "salarie" | "independant" | "createur" | null;

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [profilSelected, setProfilSelected] = useState<
    "entrepreneur" | "salarie" | "independant" | "createur"
  >(profilFromUrl ?? "entrepreneur");

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [diagnosticState, setDiagnosticState] = useState<DiagnosticState | null>(
    null
  );
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canStart = useMemo(() => {
    return firstName.trim().length > 0 && email.trim().length > 0;
  }, [firstName, email]);

  async function createSession() {
    setError(null);
    setIsCreatingSession(true);

    try {
      const response = await fetch("/api/diagnostic/session/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: firstName.trim(),
          email: email.trim(),
          profil_selected: profilSelected,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Session creation failed: ${text}`);
      }

      const data = (await response.json()) as CreateSessionResponse;
      setSessionId(data.session_id);
      setMessages([]);

      // Déclenche automatiquement la première question QCM
      await triggerFirstQuestion(data.session_id);
    } catch (err) {
      console.error(err);
      setError("Impossible de créer la session.");
    } finally {
      setIsCreatingSession(false);
    }
  }

  async function triggerFirstQuestion(currentSessionId: string) {
    setIsSending(true);
    try {
      const response = await fetch("/api/diagnostic/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: currentSessionId,
          user_message: "Démarre le diagnostic.",
        }),
      });
      if (!response.ok) return;
      const data = (await response.json()) as ChatResponse;
      const assistantMessage: UiMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.assistant_message,
      };
      setMessages([assistantMessage]);
      setDiagnosticState(data.diagnostic_state);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  }

  async function finalizeSession(currentSessionId: string) {
    setIsFinalizing(true);
    setError(null);

    try {
      const response = await fetch("/api/diagnostic/finalize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: currentSessionId,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Finalize failed: ${text}`);
      }

      const data = (await response.json()) as FinalizeResponse;
      const resultUrl = process.env.NEXT_PUBLIC_RESULT_PAGE_URL ?? "https://neuropriority-reveal.vibepreview.com";
      window.location.href = `${resultUrl}?rid=${data.result_id}`;
    } catch (err) {
      console.error(err);
      setError("Impossible de finaliser le diagnostic.");
      setIsFinalizing(false);
    }
  }

  async function sendMessage() {
    if (!sessionId || !input.trim() || isSending || isFinalizing) {
      return;
    }

    const userMessageText = input.trim();
    const userMessage: UiMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: userMessageText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);
    setError(null);

    try {
      const response = await fetch("/api/diagnostic/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          user_message: userMessageText,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Chat failed: ${text}`);
      }

      const data = (await response.json()) as ChatResponse;

      const assistantMessage: UiMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.assistant_message,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setDiagnosticState(data.diagnostic_state);

      if (data.should_finalize) {
        await finalizeSession(sessionId);
        return;
      }
    } catch (err) {
      console.error(err);
      setError("Impossible d’envoyer le message.");
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void sendMessage();
  }

  useEffect(() => {
    const savedSessionId = window.sessionStorage.getItem("diagnostic_session_id");
    const savedFirstName = window.sessionStorage.getItem("diagnostic_first_name");
    const savedEmail = window.sessionStorage.getItem("diagnostic_email");
    const savedProfile = window.sessionStorage.getItem("diagnostic_profile");

    if (savedSessionId) setSessionId(savedSessionId);
    if (savedFirstName) setFirstName(savedFirstName);
    if (savedEmail) setEmail(savedEmail);
    if (
      savedProfile === "entrepreneur" ||
      savedProfile === "salarie" ||
      savedProfile === "independant" ||
      savedProfile === "createur"
    ) {
      setProfilSelected(savedProfile);
    }
  }, []);

  useEffect(() => {
    if (sessionId) {
      window.sessionStorage.setItem("diagnostic_session_id", sessionId);
    }
  }, [sessionId]);

  useEffect(() => {
    window.sessionStorage.setItem("diagnostic_first_name", firstName);
  }, [firstName]);

  useEffect(() => {
    window.sessionStorage.setItem("diagnostic_email", email);
  }, [email]);

  useEffect(() => {
    window.sessionStorage.setItem("diagnostic_profile", profilSelected);
  }, [profilSelected]);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8 md:px-6">
        <div className="mb-8">
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-zinc-500">
            NeuroBreak Priority™
          </p>
          <h1 className="text-3xl font-semibold md:text-4xl">
            Diagnostic conversationnel
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
            Cette interface permet de tester le moteur de diagnostic en conditions
            réelles, avec une conversation progressive jusqu’à la finalisation.
          </p>
        </div>

        {!sessionId ? (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-2xl backdrop-blur">
            <h2 className="mb-4 text-xl font-medium">Démarrer une session</h2>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm text-zinc-300">Prénom</label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
                  placeholder="Christophe"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-300">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
                  placeholder="test@email.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-300">Profil</label>
                <select
                  value={profilSelected}
                  onChange={(e) =>
                    setProfilSelected(
                      e.target.value as
                        | "entrepreneur"
                        | "salarie"
                        | "independant"
                        | "createur"
                    )
                  }
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
                >
                  {PROFILE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={() => void createSession()}
                disabled={!canStart || isCreatingSession}
                className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-zinc-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreatingSession ? "Création..." : "Créer la session"}
              </button>

              {error ? (
                <p className="text-sm text-red-400">{error}</p>
              ) : (
                <p className="text-sm text-zinc-500">
                  Une première question apparaîtra dès que la session sera créée.
                </p>
              )}
            </div>
          </section>
        ) : (
          <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="flex min-h-[70vh] flex-col rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-2xl backdrop-blur">
              <div className="border-b border-zinc-800 px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-zinc-400">Session active</p>
                    <p className="text-sm font-medium text-zinc-200">
                      {firstName} · {PROFILE_OPTIONS.find((p) => p.value === profilSelected)?.label}
                    </p>
                  </div>

                  <div className="text-right text-xs text-zinc-500">
                    <p>ID session</p>
                    <p className="max-w-[180px] truncate">{sessionId}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                {messages.length === 0 ? (
                  <p className="text-sm text-zinc-500">
                    Aucun message pour le moment.
                  </p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-lg ${
                        message.role === "assistant"
                          ? "border border-zinc-800 bg-zinc-950 text-zinc-100"
                          : "ml-auto bg-white text-zinc-950"
                      }`}
                    >
                      <p className="mb-1 text-[11px] uppercase tracking-[0.2em] opacity-60">
                        {message.role === "assistant" ? "IA" : "Toi"}
                      </p>
                      <p>{message.content}</p>
                    </div>
                  ))
                )}

                {(isSending || isFinalizing) && (
                  <div className="max-w-[85%] rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-400 shadow-lg">
                    {isFinalizing
                      ? "Nous finalisons ton diagnostic..."
                      : "L’IA prépare la suite..."}
                  </div>
                )}
              </div>

              <form
                onSubmit={handleSubmit}
                className="border-t border-zinc-800 px-5 py-4"
              >
                <div className="flex gap-3">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isSending || isFinalizing}
                    placeholder="Écris ta réponse..."
                    className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isSending || isFinalizing}
                    className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-zinc-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Envoyer
                  </button>
                </div>

                {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
              </form>
            </section>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-2xl backdrop-blur">
                <h2 className="mb-3 text-lg font-medium">État du diagnostic</h2>

                {diagnosticState ? (
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="text-zinc-500">Completion score</p>
                      <p className="mt-1 text-lg font-semibold">
                        {Math.round(diagnosticState.completion_score * 100)}%
                      </p>
                    </div>

                    <div>
                      <p className="mb-2 text-zinc-500">Dimensions couvertes</p>
                      <div className="flex flex-wrap gap-2">
                        {diagnosticState.covered_dimensions.map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-zinc-500">Dimensions manquantes</p>
                      <div className="flex flex-wrap gap-2">
                        {diagnosticState.missing_dimensions.map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-500"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-zinc-500">Prochain focus</p>
                      <p className="mt-1">{diagnosticState.next_focus}</p>
                    </div>

                    <div>
                      <p className="text-zinc-500">Raison de la prochaine question</p>
                      <p className="mt-1 leading-6">
                        {diagnosticState.reason_for_next_question}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">
                    L’état du diagnostic apparaîtra après la première réponse.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-2xl backdrop-blur">
                <h2 className="mb-3 text-lg font-medium">Rappel</h2>
                <p className="text-sm leading-6 text-zinc-400">
                  La finalisation se déclenche automatiquement quand la conversation
                  a suffisamment de matière. Tu n’as rien à faire de plus.
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}