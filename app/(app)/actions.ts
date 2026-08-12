"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BUSINESS_COOKIE } from "@/lib/business";
import { endSession } from "@/lib/auth";

export async function switchBusiness(businessId: string) {
  const jar = await cookies();
  jar.set(BUSINESS_COOKIE, businessId, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
}

export async function logout() {
  await endSession();
  redirect("/login");
}
