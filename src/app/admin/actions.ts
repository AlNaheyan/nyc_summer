"use server";

import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { approvePost, removePost } from "@/lib/feed/admin";

export async function approveAction(formData: FormData) {
  if (!(await isAdmin())) return;
  await approvePost(createAdminClient(), String(formData.get("id")));
  revalidatePath("/admin");
}

export async function removeAction(formData: FormData) {
  if (!(await isAdmin())) return;
  await removePost(
    createAdminClient(),
    String(formData.get("id")),
    formData.get("ban") === "true",
  );
  revalidatePath("/admin");
}
