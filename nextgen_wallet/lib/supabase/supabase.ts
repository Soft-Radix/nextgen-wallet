import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient(); // 👈 await here

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  console.log("========user==", user);

  if (user) {
    redirect("/user/dashboard");
  } else {
    redirect("/user/welcome");
  }
}
