import { redirect } from "next/navigation";

// Consolidated into the single-page dashboard (profile is the left column).
export default function ProfilePage() {
  redirect("/spin");
}
