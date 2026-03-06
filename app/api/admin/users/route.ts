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

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: userRows, error: usersError } = await supabase
      .from("user_details")
      .select("id, mobile_number, name, created_at, status")
      .order("created_at", { ascending: false })
      .limit(500);

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

    const response: AdminUser[] = rows.map((u) => {
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

    return NextResponse.json(response);
  } catch (err) {
    console.error("admin-users fatal error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

