import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { user_id, amount } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { error: "amount must be a positive number" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch wallet for this user
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("id, user_id, balance, currency")
      .eq("user_id", user_id)
      .maybeSingle();

    if (walletError) {
      return NextResponse.json(
        { error: walletError.message },
        { status: 500 }
      );
    }

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet not found for user" },
        { status: 404 }
      );
    }

    if (Number(wallet.balance) < numericAmount) {
      return NextResponse.json(
        { error: "Insufficient wallet balance" },
        { status: 400 }
      );
    }

    const newBalance = Number(wallet.balance) - numericAmount;

    // Update wallet balance
    const { data: updatedWallet, error: updateError } = await supabase
      .from("wallets")
      .update({ balance: newBalance })
      .eq("id", wallet.id)
      .select("id, balance, currency, user_id")
      .maybeSingle();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Record withdrawal
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from("withdrawals")
      .insert({
        uuid: user_id,
        amount: numericAmount,
      })
      .select("id, uuid, amount, created_at")
      .single();

    if (withdrawalError) {
      return NextResponse.json(
        { error: withdrawalError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        withdrawal,
        wallet_balance: updatedWallet?.balance ?? newBalance,
        wallet_currency: updatedWallet?.currency ?? wallet.currency ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("withdraw POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

