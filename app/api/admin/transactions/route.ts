import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type AdminTransaction = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  type: string | null;
  sender_profile_id: string | null;
  receiver_profile_id: string | null;
  sender_name: string | null;
  receiver_name: string | null;
};

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error("admin-transactions error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data ?? []) as any[];

    const senderIds = new Set<string>();
    const receiverIds = new Set<string>();

    for (const r of rows) {
      if (r.sender_profile_id) senderIds.add(String(r.sender_profile_id));
      if (r.receiver_profile_id) receiverIds.add(String(r.receiver_profile_id));
    }

    const usersById: Record<string, string> = {};

    const allIds = Array.from(new Set([...Array.from(senderIds), ...Array.from(receiverIds)]));
    if (allIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from("user_details")
        .select("id, name")
        .in("id", allIds);

      if (!usersError && users) {
        for (const u of users as any[]) {
          if (u.id) usersById[String(u.id)] = (u as any).name ?? "";
        }
      }
    }

    const response: AdminTransaction[] = rows.map((r) => {
      const rawType = (r as any).type ?? null;
      const rawStatus = (r as any).status ?? "";
      const normalizeStatus = (value: string): string => {
        const v = value.toLowerCase();
        if (v === "completed") return "Completed";
        if (v === "pending") return "Pending";
        if (v === "failed") return "Failed";
        return value;
      };

      const senderId = r.sender_profile_id ? String(r.sender_profile_id) : null;
      const receiverId = r.receiver_profile_id ? String(r.receiver_profile_id) : null;

      return {
        id: String(r.id),
        amount: typeof r.amount === "number" ? r.amount : Number(r.amount ?? 0),
        status: normalizeStatus(String(rawStatus)),
        created_at: String(r.created_at ?? ""),
        type: rawType ? String(rawType) : null,
        sender_profile_id: senderId,
        receiver_profile_id: receiverId,
        sender_name: senderId && usersById[senderId] ? usersById[senderId] : null,
        receiver_name: receiverId && usersById[receiverId] ? usersById[receiverId] : null,
      };
    });

    return NextResponse.json(response);
  } catch (err) {
    console.error("admin-transactions fatal error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

