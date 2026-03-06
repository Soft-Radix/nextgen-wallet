import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type AdminUser = {
  id: string;
  name: string | null;
  mobile_number: string | null;
  created_at: string | null;
  status: string | null;
  wallet_balance: number | null;
  wallet_currency: string | null;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") ?? "").trim();
    const status = (searchParams.get("status") ?? "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10) || 10));
    const offset = (page - 1) * limit;

    const supabase = await createClient();

    let query = supabase
      .from("user_details")
      .select("id, mobile_number, name, created_at, status", { count: "exact" })
      .order("created_at", { ascending: false });

    if (search) {
      const escaped = search.replace(/'/g, "''").replace(/"/g, '""');
      const pattern = `%${escaped}%`;
      query = query.or(`name.ilike."${pattern}",mobile_number.ilike."${pattern}"`);
    }

    if (status && status.toLowerCase() !== "all status") {
      const statusLower = status.toLowerCase();
      if (["active", "suspended", "pending"].includes(statusLower)) {
        query = query.eq("status", statusLower);
      }
    }

    const { data: userRows, error: usersError, count } = await query.range(offset, offset + limit - 1);

    if (usersError) {
      console.error("admin-users user_details error:", usersError);
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    const rows = (userRows ?? []) as any[];
    const ids = rows.map((u) => u.id).filter((id) => !!id) as string[];

    const walletsByUserId: Record<string, { balance: number | null; currency: string | null }> = {};

    if (ids.length > 0) {
      const { data: walletRows, error: walletsError } = await supabase
        .from("wallets")
        .select("user_id, balance, currency")
        .in("user_id", ids);

      if (!walletsError && walletRows) {
        for (const w of walletRows as any[]) {
          if (!w.user_id) continue;
          walletsByUserId[String(w.user_id)] = {
            balance: typeof w.balance === "number" ? w.balance : Number(w.balance ?? 0),
            currency: w.currency ?? null,
          };
        }
      } else if (walletsError) {
        console.error("admin-users wallets error:", walletsError);
      }
    }

    const users: AdminUser[] = rows.map((u) => {
      const id = String(u.id);
      const wallet = walletsByUserId[id];
      return {
        id,
        name: u.name ?? null,
        mobile_number: u.mobile_number ?? null,
        created_at: u.created_at ?? null,
        status: u.status ?? null,
        wallet_balance: wallet?.balance ?? null,
        wallet_currency: wallet?.currency ?? null,
      };
    });

    return NextResponse.json({ users, total: count ?? users.length });
  } catch (err) {
    console.error("admin-users fatal error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
