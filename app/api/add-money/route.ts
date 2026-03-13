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

    // Try to fetch existing wallet for this user
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

    // If wallet doesn't exist yet, create one with this initial deposit
    if (!wallet) {
      const { data: newWallet, error: insertError } = await supabase
        .from("wallets")
        .insert({
          user_id,
          balance: numericAmount,
        })
        .select("id, balance, currency, user_id")
        .maybeSingle();

      if (insertError || !newWallet) {
        return NextResponse.json(
          { error: insertError?.message ?? "Unable to create wallet" },
          { status: 500 }
        );
      }

      // Create transaction record for add-money (self-transaction: sender === receiver)
      const { data: transactionData, error: transactionError } = await supabase
        .from("transactions")
        .insert({
          sender_profile_id: user_id,
          receiver_profile_id: user_id, // Self transaction
          amount: numericAmount,
          status: "completed", // Database enum uses lowercase
          // Note: type field omitted - self-transactions identified by sender_profile_id === receiver_profile_id
        })
        .select("id")
        .single();

      if (transactionError) {
        console.error("Error creating transaction:", transactionError);
        // Return error if transaction creation fails
        return NextResponse.json(
          { error: `Wallet updated but failed to create transaction: ${transactionError.message}` },
          { status: 500 }
        );
      }


      return NextResponse.json(
        {
          wallet_balance: newWallet.balance,
          wallet_currency: newWallet.currency ?? null,
          transaction_id: transactionData?.id,
        },
        { status: 200 }
      );
    }

    const newBalance = Number(wallet.balance ?? 0) + numericAmount;

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

    // Create transaction record for add-money (self-transaction: sender === receiver)
    const { data: transactionData, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        sender_profile_id: user_id,
        receiver_profile_id: user_id, // Self transaction
        amount: numericAmount,
        status: "completed", // Database enum uses lowercase
        // Note: type field omitted - self-transactions identified by sender_profile_id === receiver_profile_id
      })
      .select("id")
      .single();

    if (transactionError) {
      console.error("Error creating transaction:", transactionError);
      // Return error if transaction creation fails
      return NextResponse.json(
        { error: `Wallet updated but failed to create transaction: ${transactionError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        wallet_balance: updatedWallet?.balance ?? newBalance,
        wallet_currency: updatedWallet?.currency ?? wallet.currency ?? null,
        transaction_id: transactionData?.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("add-money POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

