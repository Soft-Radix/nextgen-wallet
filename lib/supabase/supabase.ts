import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient(); // 👈 await here

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (user.status == "active") {
    redirect("/dashboard");
  } else if (!user.name) {
    redirect("/create-profile");
  } else if (user.mobile_number && user.country_code) {
    redirect("/create-pin");
  } else {
    redirect("/");
  }
}
