import { redirect } from "next/navigation";

// Consolidated into the single-page dashboard (feed is the center column).
export default function FeedPage() {
  redirect("/spin");
}
