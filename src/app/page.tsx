import { redirect } from "next/navigation";

export default function Home() {
  // The (app) layout sends unauthenticated users to /login.
  redirect("/spin");
}
