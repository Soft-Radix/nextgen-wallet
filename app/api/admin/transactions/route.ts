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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") ?? "").trim();
    const type = (searchParams.get("type") ?? "").trim();
    const status = (searchParams.get("status") ?? "").trim();
    const fromDate = searchParams.get("from_date") ?? "";
    const toDate = searchParams.get("to_date") ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10) || 10));
    const offset = (page - 1) * limit;

    const supabase = await createClient();

    let query = supabase
      .from("transactions")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (search) {
      const escaped = search.replace(/'/g, "''").replace(/"/g, '""');
      const pattern = `%${escaped}%`;
      const isValidUUID = (s: string) =>
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s);

      // Match by sender/receiver name or mobile: find user ids first
      const { data: matchingUsers } = await supabase
        .from("user_details")
        .select("id")
        .or(`name.ilike."${pattern}",mobile_number.ilike."${pattern}",full_number.ilike."${pattern}"`);

      const matchingIds = (matchingUsers ?? [])
        .map((u: { id?: string }) => u?.id)
        .filter((id): id is string => !!id);

      const orParts: string[] = [];
      // Transaction id is UUID — only exact match supported (no ilike on uuid)
      if (isValidUUID(search)) {
        orParts.push(`id.eq."${search.replace(/"/g, '""')}"`);
      }
      if (matchingIds.length > 0) {
        const idList = matchingIds.map((id) => `"${String(id).replace(/"/g, '""')}"`).join(",");
        orParts.push(`sender_profile_id.in.(${idList})`, `receiver_profile_id.in.(${idList})`);
      }

      if (orParts.length > 0) {
        query = query.or(orParts.join(","));
      } else {
        // Search term matched neither a UUID nor any user — return no rows
        query = query.eq("id", "00000000-0000-0000-0000-000000000000");
      }
    }

    if (type && !["all_type", "all type"].includes(type.toLowerCase())) {
      query = query.eq("type", type);
    }

    if (status && !["all_status", "all status"].includes(status.toLowerCase())) {
      const statusLower = status.toLowerCase();
      if (["completed", "pending", "failed"].includes(statusLower)) {
        query = query.eq("status", statusLower);
      }
    }

    if (fromDate) {
      query = query.gte("created_at", `${fromDate}T00:00:00`);
    }
    if (toDate) {
      query = query.lte("created_at", `${toDate}T23:59:59.999`);
    }

    const { data: rows, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error("admin-transactions error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const dataRows = (rows ?? []) as any[];

    const senderIds = new Set<string>();
    const receiverIds = new Set<string>();
    for (const r of dataRows) {
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

    const transactions: AdminTransaction[] = dataRows.map((r) => {
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

    return NextResponse.json({ transactions, total: count ?? transactions.length });
  } catch (err) {
    console.error("admin-transactions fatal error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
