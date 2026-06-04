import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/server";
import { getShareablePost } from "@/lib/feed/share";

export const runtime = "nodejs";
export const alt = "Summer Quest NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The share card (TECH_SPEC §12 Phase 3 — a key virality driver).
export default async function Image({ params }: { params: { id: string } }) {
  const post = await getShareablePost(createAdminClient(), params.id).catch(() => null);

  if (!post) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg,#FFE08A,#FF5E5B)",
            fontSize: 72,
            fontWeight: 800,
            color: "#fff",
          }}
        >
          Summer Quest NYC
        </div>
      ),
      size,
    );
  }

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#fff8ef" }}>
        {/* Photo */}
        <div style={{ display: "flex", width: 600, height: "100%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.photoUrl} alt="" width={600} height={630} style={{ objectFit: "cover" }} />
        </div>
        {/* Text panel */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 56,
            width: 600,
            background: "linear-gradient(160deg,#FFE08A 0%,#FF8C8A 100%)",
          }}
        >
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#7a2018" }}>
            ☀ Summer Quest NYC
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 60, fontWeight: 800, color: "#2a1a12", lineHeight: 1.05 }}>
              {post.questTitle}
            </div>
            <div style={{ fontSize: 34, color: "#5a3a2a" }}>
              {post.authorName} did it{post.locationName ? ` at ${post.locationName}` : ""}.
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 600, color: "#7a2018" }}>
            Spin yours → summerquest.nyc
          </div>
        </div>
      </div>
    ),
    size,
  );
}
