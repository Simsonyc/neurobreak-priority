"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

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

type CreateSessionResponse = { session_id: string };
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

function parseChoices(content: string): string[] {
  const lines = content.split("\n");
  const choices: string[] = [];
  for (const line of lines) {
    if (line.match(/^[A-H]\)\s+.+/)) choices.push(line.trim());
  }
  return choices;
}

function stripChoices(content: string): string {
  return content
    .split("\n")
    .filter((line) => !line.match(/^[A-H]\)\s+/))
    .join("\n")
    .replace(/→\s*Réponds avec [A-H](,\s*[A-H])* ou [A-H]\.?/gi, "")
    .replace(/Choisis une lettre\./gi, "")
    .trim();
}

function choiceLetter(choice: string): string {
  return choice.match(/^([A-H])/)?.[1] ?? choice;
}

function choiceText(choice: string): string {
  return choice.replace(/^[A-H]\)\s*/, "").trim();
}

export function ChatShell() {
  const searchParams = useSearchParams();
  const profilFromUrl = searchParams.get("profil") as
    | "entrepreneur" | "salarie" | "independant" | "createur" | null;

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [profilSelected, setProfilSelected] = useState<
    "entrepreneur" | "salarie" | "independant" | "createur"
  >(profilFromUrl ?? "entrepreneur");

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [diagnosticState, setDiagnosticState] = useState<DiagnosticState | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const canStart = useMemo(
    () => firstName.trim().length > 0 && email.trim().length > 0,
    [firstName, email]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending, isFinalizing]);

  useEffect(() => {
    const sid = window.sessionStorage.getItem("diagnostic_session_id");
    const fn = window.sessionStorage.getItem("diagnostic_first_name");
    const em = window.sessionStorage.getItem("diagnostic_email");
    const pr = window.sessionStorage.getItem("diagnostic_profile");
    if (sid) setSessionId(sid);
    if (fn) setFirstName(fn);
    if (em) setEmail(em);
    if (pr === "entrepreneur" || pr === "salarie" || pr === "independant" || pr === "createur") {
      setProfilSelected(pr);
    }
  }, []);

  useEffect(() => { if (sessionId) window.sessionStorage.setItem("diagnostic_session_id", sessionId); }, [sessionId]);
  useEffect(() => { window.sessionStorage.setItem("diagnostic_first_name", firstName); }, [firstName]);
  useEffect(() => { window.sessionStorage.setItem("diagnostic_email", email); }, [email]);
  useEffect(() => { window.sessionStorage.setItem("diagnostic_profile", profilSelected); }, [profilSelected]);

  async function createSession() {
    setError(null);
    setIsCreatingSession(true);
    try {
      const res = await fetch("/api/diagnostic/session/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName.trim(),
          email: email.trim(),
          profil_selected: profilSelected,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as CreateSessionResponse;
      setSessionId(data.session_id);
      setMessages([]);
      await triggerFirstQuestion(data.session_id);
    } catch (err) {
      console.error(err);
      setError("Impossible de créer la session.");
    } finally {
      setIsCreatingSession(false);
    }
  }

  async function triggerFirstQuestion(sid: string) {
    setIsSending(true);
    try {
      const res = await fetch("/api/diagnostic/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sid, user_message: "Démarre le diagnostic." }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as ChatResponse;
      setMessages([{ id: crypto.randomUUID(), role: "assistant", content: data.assistant_message }]);
      setDiagnosticState(data.diagnostic_state);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  }

  async function finalizeSession(sid: string) {
    setIsFinalizing(true);
    setError(null);
    try {
      const res = await fetch("/api/diagnostic/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sid }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as FinalizeResponse;
      const resultUrl =
        process.env.NEXT_PUBLIC_RESULT_PAGE_URL ??
        "https://neuropriority-reveal.vibepreview.com/diagnostic-result";
      window.location.href = `${resultUrl}?rid=${data.result_id}`;
    } catch (err) {
      console.error(err);
      setError("Impossible de finaliser le diagnostic.");
      setIsFinalizing(false);
    }
  }

  async function sendMessage(text?: string) {
    const msgText = (text ?? input).trim();
    if (!sessionId || !msgText || isSending || isFinalizing) return;

    const userMsg: UiMessage = { id: crypto.randomUUID(), role: "user", content: msgText };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsSending(true);
    setError(null);

    try {
      const res = await fetch("/api/diagnostic/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, user_message: msgText }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as ChatResponse;

      // Affiche le message AVANT de décider de finaliser
      const assistantMsg: UiMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.assistant_message,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setDiagnosticState(data.diagnostic_state);

      // Finalise après un délai pour que le message soit lisible
      if (data.should_finalize) {
        setTimeout(() => void finalizeSession(sessionId), 2500);
      }
    } catch (err) {
      console.error(err);
      setError("Impossible d'envoyer le message.");
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void sendMessage();
  }

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");
  const currentChoices = lastAssistantMsg && !isSending && !isFinalizing
    ? parseChoices(lastAssistantMsg.content)
    : [];
  const hasChoices = currentChoices.length > 0;
  const progress = diagnosticState ? Math.round(diagnosticState.completion_score * 100) : 0;

  return (
    <main
      className="min-h-screen"
      style={{
        background: "#09090b",
        backgroundImage: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(232,20,60,0.12) 0%, transparent 60%)",
        color: "#fff",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* HEADER */}
      <div
        className="sticky top-0 z-50 px-4 py-3"
        style={{
          background: "rgba(9,9,11,0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em" }}>
            Neuro<span style={{ color: "#E8143C" }}>Priority™</span>
          </span>
          {sessionId && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 100, height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${progress}%`, height: "100%", background: "#E8143C", borderRadius: 4, transition: "width 0.7s ease" }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#E8143C" }}>{progress}%</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px", minHeight: "calc(100vh - 57px)", display: "flex", flexDirection: "column" }}>

        {!sessionId ? (
          // ── ÉCRAN INTRO ──
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>

            {/* Badge + titre */}
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "5px 16px", borderRadius: 100, marginBottom: 20,
                background: "rgba(232,20,60,0.08)", border: "1px solid rgba(232,20,60,0.25)",
                fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#E8143C"
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#E8143C", boxShadow: "0 0 8px #E8143C", animation: "pulse 2s ease-in-out infinite" }} />
                Diagnostic Priority OS
              </div>
              <h1 style={{ fontSize: "clamp(28px, 7vw, 40px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 16 }}>
                Découvre les priorités<br />
                <span style={{ color: "#E8143C" }}>qui pilotent vraiment ta vie</span>
              </h1>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, maxWidth: 420, margin: "0 auto" }}>
                10 questions ciblées + quelques approfondissements.<br />
                <strong style={{ color: "rgba(255,255,255,0.7)" }}>Durée estimée : 5 à 8 minutes.</strong>
              </p>
            </div>

            {/* Consignes */}
            <div style={{
              marginBottom: 28, padding: "20px 24px", borderRadius: 16,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)"
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#E8143C", marginBottom: 12 }}>
                Comment ça marche
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.65 }}>
                <p>① Pour chaque dimension psychologique, tu choisis parmi plusieurs options.</p>
                <p>② L'IA creuse ensuite avec 2 questions ouvertes pour affiner.</p>
                <p>③ Plus tu es précis et honnête, plus le diagnostic sera pertinent.</p>
                <p>④ Il n'y a pas de bonne ou mauvaise réponse — sois vrai avec toi-même.</p>
              </div>
            </div>

            {/* Formulaire */}
            <div style={{ padding: "24px", borderRadius: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                {[
                  { label: "Prénom", value: firstName, setter: setFirstName, placeholder: "Ton prénom", type: "text" },
                  { label: "Email", value: email, setter: setEmail, placeholder: "ton@email.com", type: "email" },
                ].map(({ label, value, setter, placeholder, type }) => (
                  <div key={label}>
                    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>{label}</p>
                    <input
                      type={type}
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      placeholder={placeholder}
                      style={{
                        width: "100%", padding: "12px 16px", borderRadius: 12,
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                        color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box"
                      }}
                    />
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 10 }}>Ton profil</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
                {PROFILE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setProfilSelected(opt.value)}
                    style={{
                      padding: "10px 12px", borderRadius: 12, fontSize: 13, fontWeight: 600,
                      cursor: "pointer", transition: "all 0.2s",
                      background: profilSelected === opt.value ? "rgba(232,20,60,0.15)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${profilSelected === opt.value ? "rgba(232,20,60,0.45)" : "rgba(255,255,255,0.08)"}`,
                      color: profilSelected === opt.value ? "#E8143C" : "rgba(255,255,255,0.5)",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => void createSession()}
                disabled={!canStart || isCreatingSession}
                style={{
                  width: "100%", padding: "16px", borderRadius: 14, border: "none",
                  background: canStart ? "#E8143C" : "rgba(232,20,60,0.3)",
                  color: "#fff", fontSize: 15, fontWeight: 700, cursor: canStart ? "pointer" : "not-allowed",
                  boxShadow: canStart ? "0 0 30px rgba(232,20,60,0.35)" : "none",
                  transition: "all 0.3s",
                }}
              >
                {isCreatingSession ? "Démarrage…" : "Démarrer le diagnostic →"}
              </button>
              {error && <p style={{ marginTop: 10, fontSize: 13, color: "#f87171", textAlign: "center" }}>{error}</p>}
            </div>
          </div>

        ) : (
          // ── ÉCRAN CHAT ──
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", paddingBottom: 16, display: "flex", flexDirection: "column", gap: 16 }}>
              {messages.filter(m => m.content !== "Démarre le diagnostic.").map((msg, idx) => {
                const isLast = idx === messages.length - 1;
                const isAssistant = msg.role === "assistant";

                if (isAssistant) {
                  const displayText = isLast ? stripChoices(msg.content) : msg.content;
                  const choices = isLast ? currentChoices : [];

                  return (
                    <div key={msg.id} style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: "92%" }}>
                      <div style={{
                        padding: "16px 20px", borderRadius: "18px 18px 18px 4px",
                        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                        fontSize: 15, lineHeight: 1.75, color: "rgba(255,255,255,0.9)",
                        whiteSpace: "pre-wrap",
                      }}>
                        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#E8143C", marginBottom: 8 }}>
                          Priority OS
                        </p>
                        {displayText}
                      </div>

                      {/* Boutons de choix */}
                      {choices.length > 0 && !isSending && !isFinalizing && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 4 }}>
                          {choices.map((choice) => (
                            <button
                              key={choice}
                              onClick={() => void sendMessage(choiceLetter(choice))}
                              style={{
                                padding: "12px 16px", borderRadius: 12, textAlign: "left",
                                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                                color: "rgba(255,255,255,0.7)", fontSize: 14, cursor: "pointer",
                                display: "flex", alignItems: "flex-start", gap: 12, transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                const el = e.currentTarget;
                                el.style.background = "rgba(232,20,60,0.08)";
                                el.style.borderColor = "rgba(232,20,60,0.3)";
                                el.style.color = "#fff";
                              }}
                              onMouseLeave={(e) => {
                                const el = e.currentTarget;
                                el.style.background = "rgba(255,255,255,0.03)";
                                el.style.borderColor = "rgba(255,255,255,0.08)";
                                el.style.color = "rgba(255,255,255,0.7)";
                              }}
                            >
                              <span style={{ color: "#E8143C", fontWeight: 700, fontSize: 13, minWidth: 20, paddingTop: 1 }}>
                                {choiceLetter(choice)}
                              </span>
                              <span style={{ lineHeight: 1.55 }}>{choiceText(choice)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div key={msg.id} style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{
                      padding: "12px 18px", borderRadius: "18px 18px 4px 18px",
                      background: "rgba(232,20,60,0.14)", border: "1px solid rgba(232,20,60,0.22)",
                      fontSize: 14, lineHeight: 1.6, color: "#fff", maxWidth: "80%",
                    }}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}

              {(isSending || isFinalizing) && (
                <div style={{
                  padding: "14px 18px", borderRadius: "18px 18px 18px 4px",
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                  fontSize: 14, color: "rgba(255,255,255,0.4)", maxWidth: "60%",
                }}>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#E8143C", marginBottom: 6 }}>
                    Priority OS
                  </p>
                  {isFinalizing ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span style={{ display: "inline-flex", gap: 4 }}>
                        {[0, 150, 300].map((delay) => (
                          <span className="animate-bounce" style={{
                            width: 6, height: 6, borderRadius: "50%", background: "#E8143C",
                            display: "inline-block",
                            animationDelay: delay + "ms"
                          }} />
                        ))}
                      </span>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Génération du diagnostic…</span>
                    </span>
                  ) : (
                    <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}>
                      <span className="animate-bounce" style={{ width: 7, height: 7, borderRadius: "50%", background: "#E8143C", display: "inline-block", animationDelay: "0ms" }} />
                      <span className="animate-bounce" style={{ width: 7, height: 7, borderRadius: "50%", background: "#E8143C", display: "inline-block", animationDelay: "150ms" }} />
                      <span className="animate-bounce" style={{ width: 7, height: 7, borderRadius: "50%", background: "#E8143C", display: "inline-block", animationDelay: "300ms" }} />
                    </span>
                  )}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{
              position: "sticky", bottom: 0, paddingTop: 12,
              background: "rgba(9,9,11,0.95)", backdropFilter: "blur(12px)",
            }}>
              {hasChoices && (
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textAlign: "center", marginBottom: 8 }}>
                  Choisis une option ci-dessus ou tape ta réponse librement
                </p>
              )}
              <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isSending || isFinalizing}
                  placeholder={hasChoices ? "Ou précise ta réponse…" : "Écris ta réponse…"}
                  style={{
                    flex: 1, padding: "13px 16px", borderRadius: 12, fontSize: 15,
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff", outline: "none",
                    opacity: isSending || isFinalizing ? 0.4 : 1,
                  }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isSending || isFinalizing}
                  style={{
                    padding: "13px 20px", borderRadius: 12, border: "none",
                    background: "#E8143C", color: "#fff", fontSize: 16, fontWeight: 700,
                    cursor: input.trim() && !isSending && !isFinalizing ? "pointer" : "not-allowed",
                    opacity: !input.trim() || isSending || isFinalizing ? 0.4 : 1,
                  }}
                >
                  →
                </button>
              </form>
              {error && <p style={{ marginTop: 8, fontSize: 12, color: "#f87171" }}>{error}</p>}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
