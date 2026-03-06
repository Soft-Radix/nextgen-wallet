import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type DisbursementBody = {
  id?: string;
  amount?: number;
  // other fields may be sent but are ignored
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DisbursementBody;
    const id = body.id;
    const amount = body.amount;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing or invalid id" }, { status: 400 });
    }

    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Missing or invalid amount" }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch wallet for this user_id
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("id, balance, currency")
      .eq("user_id", id)
      .maybeSingle();

    if (walletError) {
      console.error("admin-disbursements wallet fetch error:", walletError);
      return NextResponse.json({ error: walletError.message }, { status: 500 });
    }

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found for user" }, { status: 404 });
    }

    const currentBalance =
      typeof wallet.balance === "number" ? wallet.balance : Number(wallet.balance ?? 0);
    const newBalance = currentBalance + amount;

    const { error: updateError } = await supabase
      .from("wallets")
      .update({ balance: newBalance })
      .eq("id", wallet.id);

    if (updateError) {
      console.error("admin-disbursements wallet update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        user_id: id,
        amount,
        wallet_balance: newBalance,
        wallet_currency: wallet.currency ?? null,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("admin-disbursements fatal error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

