import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type AdminUserDetailTransaction = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  type: "Debit" | "Credit";
  sender_profile_id: string | null;
  receiver_profile_id: string | null;
  sender_name: string | null;
  receiver_name: string | null;
  note: string | null;
};

export type AdminUserDetailResponse = {
  user: {
    id: string;
    created_at: string | null;
    full_number: string | null;
    name: string | null;
    status: string | null;
  };
  balance: number | null;
  currency: string | null;
  transactions: AdminUserDetailTransaction[];
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "User id is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // 1) User from user_details: created_at, full_number, name, status
    const { data: userRow, error: userError } = await supabase
      .from("user_details")
      .select("id, created_at, full_number, name, status")
      .eq("id", id)
      .maybeSingle();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }
    if (!userRow) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2) Balance from wallets by user_id
    const { data: walletRows, error: walletError } = await supabase
      .from("wallets")
      .select("balance, currency")
      .eq("user_id", id)
      .limit(1);

    if (walletError) {
      return NextResponse.json({ error: walletError.message }, { status: 500 });
    }
    const wallet = Array.isArray(walletRows) && walletRows.length > 0 ? walletRows[0] : null;
    const balance =
      wallet && typeof (wallet as any).balance === "number"
        ? (wallet as any).balance
        : wallet
          ? Number((wallet as any).balance ?? 0)
          : null;
    const currency = wallet ? (wallet as any).currency ?? null : null;

    // 3) Transactions where this user is sender or receiver
    const { data: txRows, error: txError } = await supabase
      .from("transactions")
      .select("id, amount, status, created_at, sender_profile_id, receiver_profile_id, note")
      .or(`sender_profile_id.eq.${id},receiver_profile_id.eq.${id}`)
      .order("created_at", { ascending: false })
      .limit(200);

    if (txError) {
      return NextResponse.json({ error: txError.message }, { status: 500 });
    }

    const rows = (txRows ?? []) as any[];
    const senderIds = new Set<string>();
    const receiverIds = new Set<string>();
    for (const r of rows) {
      if (r.sender_profile_id) senderIds.add(String(r.sender_profile_id));
      if (r.receiver_profile_id) receiverIds.add(String(r.receiver_profile_id));
    }
    const allIds = Array.from(new Set([...senderIds, ...receiverIds]));
    const usersById: Record<string, string> = {};
    if (allIds.length > 0) {
      const { data: users, error: uErr } = await supabase
        .from("user_details")
        .select("id, name")
        .in("id", allIds);
      if (!uErr && users) {
        for (const u of users as any[]) {
          if (u.id) usersById[String(u.id)] = u.name ?? "";
        }
      }
    }

    const transactions: AdminUserDetailTransaction[] = rows.map((r) => {
      const senderId = r.sender_profile_id ? String(r.sender_profile_id) : null;
      const receiverId = r.receiver_profile_id ? String(r.receiver_profile_id) : null;
      const isCurrentUserSender = senderId === id;
      const type: "Debit" | "Credit" = isCurrentUserSender ? "Debit" : "Credit";

      const normalizeStatus = (value: string): string => {
        const v = (value ?? "").toLowerCase();
        if (v === "completed") return "Completed";
        if (v === "pending") return "Pending";
        if (v === "failed") return "Failed";
        return value || "—";
      };

      return {
        id: String(r.id),
        amount: typeof r.amount === "number" ? r.amount : Number(r.amount ?? 0),
        status: normalizeStatus(String(r.status ?? "")),
        created_at: String(r.created_at ?? ""),
        type,
        sender_profile_id: senderId,
        receiver_profile_id: receiverId,
        sender_name: senderId ? usersById[senderId] ?? null : null,
        receiver_name: receiverId ? usersById[receiverId] ?? null : null,
        note: r.note != null && String(r.note).trim() !== "" ? String(r.note).trim() : null,
      };
    });

    const response: AdminUserDetailResponse = {
      user: {
        id: String(userRow.id),
        created_at: userRow.created_at ?? null,
        full_number: userRow.full_number ?? null,
        name: userRow.name ?? null,
        status: userRow.status ?? null,
      },
      balance,
      currency,
      transactions,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("admin user detail error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
