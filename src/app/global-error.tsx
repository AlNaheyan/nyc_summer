"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary for errors thrown in the ROOT layout itself. It replaces
 * <html>/<body>, so it must render them and can't depend on the app's fonts or
 * Tailwind (which may be the thing that broke) — hence inline styles.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          padding: "1.5rem",
          textAlign: "center",
          background: "linear-gradient(to bottom, #FFE08A, #FFF7E8, #7FD4F5)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#2A1A12",
        }}
      >
        <div style={{ fontSize: "4rem", lineHeight: 1 }} aria-hidden>
          🌩️
        </div>
        <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 700, color: "#FF5E5B" }}>
          Something broke
        </h1>
        <p style={{ margin: 0, maxWidth: "20rem", fontWeight: 500, opacity: 0.75 }}>
          The app hit an unexpected error. Reloading usually clears it up.
        </p>
        <button
          onClick={reset}
          style={{
            border: "none",
            cursor: "pointer",
            borderRadius: "2.5rem",
            background: "#FF5E5B",
            color: "#fff",
            padding: "0.75rem 2rem",
            fontSize: "1.125rem",
            fontWeight: 600,
            boxShadow: "0 5px 0 0 #D6443F",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
