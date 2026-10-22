"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { exigirSessao } from "@/lib/auth";
import { COOKIE_EMPRESA } from "@/lib/empresa";

export async function escolherEmpresa(id: string) {
  await exigirSessao();
  (await cookies()).set(COOKIE_EMPRESA, id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
}
