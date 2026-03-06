import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RecentTransaction = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  sender_profile_id: string | null;
  sender_name: string | null;
};

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: txRows, error: txError } = await supabase
      .from("transactions")
      .select("id, amount, status, created_at, sender_profile_id")
      .order("created_at", { ascending: false })
      .limit(5);

    if (txError) {
      console.error("recent-transactions error:", txError);
      return NextResponse.json({ error: txError.message }, { status: 500 });
    }

    const rows = txRows ?? [];

    const senderIds = Array.from(
      new Set(
        rows
          .map((r) => r.sender_profile_id)
          .filter((id): id is string => !!id)
      )
    );

    let usersById: Record<string, string> = {};
    if (senderIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from("user_details")
        .select("id, name")
        .in("id", senderIds);

      if (!usersError && users) {
        usersById = users.reduce<Record<string, string>>((acc, u) => {
          if (u.id) acc[String(u.id)] = (u as any).name ?? "";
          return acc;
        }, {});
      }
    }

    const response: RecentTransaction[] = rows.map((r) => ({
      id: String(r.id),
      amount: typeof r.amount === "number" ? r.amount : Number(r.amount ?? 0),
      status: String(r.status ?? ""),
      created_at: r.created_at as string,
      sender_profile_id: r.sender_profile_id ? String(r.sender_profile_id) : null,
      sender_name:
        r.sender_profile_id && usersById[String(r.sender_profile_id)]
          ? usersById[String(r.sender_profile_id)]
          : null,
    }));

    return NextResponse.json(response);
  } catch (err) {
    console.error("recent-transactions fatal error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

