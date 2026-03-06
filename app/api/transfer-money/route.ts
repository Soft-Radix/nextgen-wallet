import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const {
      sender_id,
      receiver_id,
      receiver_phone,
      amount,
      note,
      name,
      is_contact,
      pin,
      sender_name,
    } = await request.json();

    if (!sender_id) {
      return NextResponse.json(
        { error: "sender_id is required" },
        { status: 400 }
      );
    }

    if ((!receiver_id && !receiver_phone) || amount == null) {
      return NextResponse.json(
        { error: "receiver_id or receiver_phone and amount are required" },
        { status: 400 }
      );
    }

    if (!pin) {
      return NextResponse.json({ error: "PIN is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Validate PIN against user_details
    const { data: senderDetails, error: senderError } = await supabase
      .from("user_details")
      .select("pin")
      .eq("id", sender_id)
      .maybeSingle();

    if (senderError || !senderDetails?.pin) {
      return NextResponse.json(
        { error: "Unable to verify PIN" },
        { status: 400 }
      );
    }

    if (String(senderDetails.pin) !== String(pin)) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 400 });
    }

    const { data, error } = await supabase.rpc("transfer_money", {
      p_sender_profile_id: sender_id,
      p_receiver_profile_id: receiver_id ?? null,
      p_receiver_phone: receiver_phone ?? null,
      p_name: name ?? null,
      p_amount: amount,
      p_note: note ?? null,
      p_is_contact: is_contact ?? false,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const transactionId = data;

    if (sender_name && transactionId) {
      const { error: updateError } = await supabase
        .from("transactions")
        .update({ sender_name })
        .eq("id", transactionId);

      if (updateError) {
        console.error("Failed to update sender_name on transaction:", updateError);
      }
    }

    // Fetch updated sender wallet balance so frontend can update Redux
    const { data: senderWallet, error: walletError } = await supabase
      .from("wallets")
      .select("balance, currency")
      .eq("user_id", sender_id)
      .maybeSingle();

    if (walletError) {
      // Still return transaction id; wallet info is optional
      return NextResponse.json({ transaction_id: transactionId }, { status: 200 });
    }

    return NextResponse.json(
      {
        transaction_id: transactionId,
        wallet_balance: senderWallet?.balance ?? null,
        wallet_currency: senderWallet?.currency ?? null,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("transfer_money error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
