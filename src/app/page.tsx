"use client";

import { useMemo, useState } from "react";

import { PRODUCT_DEFINITIONS } from "@/config/products";
import { extractFinalizedRequirement } from "@/lib/requirements";

import styles from "./page.module.css";

type Role = "user" | "assistant";

type Message = {
  role: Role;
  content: string;
};

const FINAL_REQUIREMENTS_SAVED_MARKER = "[[FINAL_REQUIREMENTS_SAVED]]";

const INITIAL_ASSISTANT_MESSAGE =
  "Hi! Tell me what product you need and I will gather characteristics, logo specs, and packing specs.";

function toDisplayContent(content: string) {
  return content.replace(FINAL_REQUIREMENTS_SAVED_MARKER, "").trim();
}

export default function Home() {
  const productKey = PRODUCT_DEFINITIONS[0].key;
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: INITIAL_ASSISTANT_MESSAGE },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const isChatLocked = useMemo(() => {
    const latestAssistant = [...messages].reverse().find((msg) => msg.role === "assistant");
    if (!latestAssistant) {
      return false;
    }

    return (
      latestAssistant.content.includes(FINAL_REQUIREMENTS_SAVED_MARKER) ||
      Boolean(extractFinalizedRequirement(latestAssistant.content))
    );
  }, [messages]);

  async function onSendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isChatLocked) {
      return;
    }
    const userMessage = input.trim();
    if (!userMessage || isSending) {
      return;
    }

    setInput("");
    const updatedMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(updatedMessages);
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productKey,
          messages: updatedMessages.map((msg) => ({ role: msg.role, content: msg.content })),
        }),
      });

      if (!response.ok || !response.body) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to get chat response.");
      }

      setMessages((previous) => [...previous, { role: "assistant", content: "" }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setMessages((previous) => {
          const next = [...previous];
          const lastIndex = next.length - 1;
          next[lastIndex] = { role: "assistant", content: fullText };
          return next;
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error.";
      setMessages((previous) => [
        ...previous,
        { role: "assistant", content: `Sorry, I hit an error: ${message}` },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <h1>Supplychain AI Agent</h1>
          <p>Collect complete sourcing requirements before sending to suppliers.</p>
        </header>

        <section className={styles.flowDiagram} aria-label="Process flow">
          <h2>Workflow</h2>
          <div className={styles.flowSteps}>
            <article className={styles.flowStep}>
              <span className={styles.stepNumber}>1</span>
              <div className={styles.stepIcon} aria-hidden="true">
                📝
              </div>
              <h3>Client Requirements</h3>
              <p>Collect needs</p>
            </article>
            <span className={styles.flowArrow} aria-hidden="true">
              →
            </span>
            <article className={styles.flowStep}>
              <span className={styles.stepNumber}>2</span>
              <div className={styles.stepIcon} aria-hidden="true">
                🏭
              </div>
              <h3>Factory Discovery</h3>
              <p>Capabilities and condition check</p>
            </article>
            <span className={styles.flowArrow} aria-hidden="true">
              →
            </span>
            <article className={styles.flowStep}>
              <span className={styles.stepNumber}>3</span>
              <div className={styles.stepIcon} aria-hidden="true">
                ✅
              </div>
              <h3>Manager Review</h3>
              <p>Approve or request correction</p>
            </article>
          </div>
        </section>

        <section className={styles.chatBox}>
          {messages.map((message, index) => (
            <article
              key={`${message.role}-${index}`}
              className={message.role === "user" ? styles.userBubble : styles.agentBubble}
            >
              <strong>{message.role === "user" ? "You" : "Agent"}:</strong>
              <p>{toDisplayContent(message.content)}</p>
            </article>
          ))}
        </section>

        <form className={styles.chatForm} onSubmit={onSendMessage}>
          <input
            className={styles.input}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Describe your product requirements..."
            disabled={isSending || isChatLocked}
          />
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={isSending || isChatLocked || !input.trim()}
          >
            {isSending ? "Sending..." : "Send"}
          </button>
        </form>
        {isChatLocked ? (
          <p className={styles.saveHint}>
            Final requirements JSON is ready and auto-saved by the AI. Chat is locked to keep it unchanged.
          </p>
        ) : null}
      </main>
    </div>
  );
}
