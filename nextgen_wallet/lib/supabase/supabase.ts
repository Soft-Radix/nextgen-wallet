import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient(); // 👈 await here

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/user/dashboard");
  } else {
    redirect("/user/welcome");
  }
}
