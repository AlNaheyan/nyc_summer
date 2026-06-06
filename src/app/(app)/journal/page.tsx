import { redirect } from "next/navigation";

// Consolidated into the single-page dashboard (journal is in the right column).
export default function JournalPage() {
  redirect("/spin");
}
