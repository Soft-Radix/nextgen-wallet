import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient(); // 👈 await here

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  console.log("========user==", user);

  if (user.status == "active") {
    redirect("/user/dashboard");
  } else if (user.mobile_number && user.country_code) {
    redirect("/user/create-pin");
  } else {
    redirect("/user/welcome");
  }
}
