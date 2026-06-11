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
          gap: "1.25rem",
          padding: "1.5rem",
          textAlign: "center",
          background: "#F5EEE1",
          fontFamily: "Georgia, 'Times New Roman', serif",
          color: "#26201A",
        }}
      >
        <div
          aria-hidden
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "4rem",
            height: "4rem",
            borderRadius: "9999px",
            border: "1px solid #E2D6BE",
            background: "#FBF6EC",
            color: "#C2562E",
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 16a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.5A4.5 4.5 0 0 1 17 16" />
            <path d="m13 12-3 5h4l-3 5" />
          </svg>
        </div>
        <p style={{ margin: 0, fontSize: "0.6875rem", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600, color: "#6F6354", fontFamily: "system-ui, sans-serif" }}>
          Something broke
        </p>
        <h1 style={{ margin: 0, fontSize: "2.25rem", fontWeight: 600, letterSpacing: "-0.012em" }}>
          A summer storm
        </h1>
        <p style={{ margin: 0, maxWidth: "20rem", color: "#6F6354", fontFamily: "system-ui, sans-serif" }}>
          The app hit an unexpected error. Reloading usually clears it up.
        </p>
        <button
          onClick={reset}
          style={{
            border: "none",
            cursor: "pointer",
            borderRadius: "9999px",
            background: "#C2562E",
            color: "#FBF6EC",
            padding: "0.75rem 2rem",
            fontSize: "1rem",
            fontWeight: 600,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
