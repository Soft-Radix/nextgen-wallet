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

    // Try calling with p_sender_name first (new signature)
    let data, error;
    let rpcCall = await supabase.rpc("transfer_money", {
      p_sender_profile_id: sender_id,
      p_receiver_profile_id: receiver_id ?? null,
      p_receiver_phone: receiver_phone ?? null,
      p_name: name ?? null,
      p_amount: amount,
      p_note: note ?? null,
      p_is_contact: is_contact ?? false,
      p_sender_name: sender_name ?? null,
    });
    
    data = rpcCall.data;
    error = rpcCall.error;

    // If schema cache error, try without p_sender_name as fallback
    if (error?.message?.includes("schema cache") || error?.message?.includes("Could not find the function")) {
      console.warn(
        "Schema cache error detected, trying fallback without p_sender_name. Error:",
        error.message
      );
      
      // Fallback: call without p_sender_name
      const fallbackCall = await supabase.rpc("transfer_money", {
        p_sender_profile_id: sender_id,
        p_receiver_profile_id: receiver_id ?? null,
        p_receiver_phone: receiver_phone ?? null,
        p_name: name ?? null,
        p_amount: amount,
        p_note: note ?? null,
        p_is_contact: is_contact ?? false,
      });
      
      if (fallbackCall.error) {
        console.error("Fallback RPC call also failed:", fallbackCall.error);
        return NextResponse.json(
          {
            error:
              "Database function error. Please ensure the transfer_money function exists and restart the server to refresh the schema cache.",
            details: fallbackCall.error.message,
          },
          { status: 500 }
        );
      }
      
      data = fallbackCall.data;
      error = null;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const transactionId = data;

    // Before updating, check if there's a previous reverse transaction with a name set
    // This ensures new transactions use the name from previous transactions
    let nameToUseForSenderName = sender_name;
    let nameToUseForReceiverName = name;
    
    if (receiver_id) {
      // Check if receiver previously sent money to sender and set a name
      // If so, use that name for sender_name in the new transaction
      if (!nameToUseForSenderName) {
        const { data: reverseTx } = await supabase
          .from("transactions")
          .select("name")
          .eq("sender_profile_id", receiver_id) // Receiver was sender
          .eq("receiver_profile_id", sender_id) // Sender was receiver
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (reverseTx?.name) {
          nameToUseForSenderName = reverseTx.name;
        }
      }

      // Check if sender previously sent money to receiver and receiver set a sender_name
      // If so, use that sender_name for name in the new transaction (receiver's updated name)
      if (!nameToUseForReceiverName) {
        const { data: previousTx } = await supabase
          .from("transactions")
          .select("sender_name")
          .eq("sender_profile_id", sender_id) // Sender was sender
          .eq("receiver_profile_id", receiver_id) // Receiver was receiver
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (previousTx?.sender_name) {
          nameToUseForReceiverName = previousTx.sender_name;
        }
      }
    }

    // Update the transaction with names from previous transactions if available
    if (transactionId) {
      const updates: { sender_name?: string; name?: string } = {};
      
      if (nameToUseForSenderName) {
        updates.sender_name = nameToUseForSenderName;
      }
      
      if (nameToUseForReceiverName && nameToUseForReceiverName !== name) {
        updates.name = nameToUseForReceiverName;
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from("transactions")
          .update(updates)
          .eq("id", transactionId);

        if (updateError) {
          console.error(
            "Failed to update transaction with names from previous transactions:",
            updateError
          );
        }
      }
    }

    // If receiver sends money back to sender, update sender_name in ALL matching previous transactions
    // When B sends to A, find ALL transactions where A was sender and B was receiver, update A's sender_name
    // This ensures the name is consistent across all previous transactions between these two users
    // Note: Future transactions will automatically use this name via the check above (nameToUseForSenderName)
    if (name && transactionId && receiver_id) {
      // Update ALL previous transactions where:
      // - current receiver was the sender (receiver_id was sender_profile_id)
      // - current sender was the receiver (sender_id was receiver_profile_id)
      const { data: updatedTxs, error: updatePrevError } = await supabase
        .from("transactions")
        .update({ sender_name: name })
        .eq("sender_profile_id", receiver_id) // Previous sender = current receiver
        .eq("receiver_profile_id", sender_id) // Previous receiver = current sender
        .select("id");

      if (updatePrevError) {
        console.error(
          "Failed to update sender_name on previous transactions:",
          updatePrevError
        );
      } else if (updatedTxs && updatedTxs.length > 0) {
        console.log(
          `Updated sender_name for ${updatedTxs.length} previous transaction(s)`
        );
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
      return NextResponse.json(
        { transaction_id: transactionId },
        { status: 200 }
      );
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
