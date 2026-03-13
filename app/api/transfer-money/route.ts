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

    // When sender sends money to receiver with a name, update ALL previous transactions
    // where sender sent to the same receiver with the latest name
    // This ensures all previous transactions show the most recent name
    if (name && transactionId && receiver_id) {
      // Update ALL previous transactions where:
      // - current sender was the sender (sender_id was sender_profile_id)
      // - current receiver was the receiver (receiver_id was receiver_profile_id)
      const { data: updatedTxs, error: updatePrevError } = await supabase
        .from("transactions")
        .update({ name: name })
        .eq("sender_profile_id", sender_id) // Previous sender = current sender
        .eq("receiver_profile_id", receiver_id) // Previous receiver = current receiver
        .neq("id", transactionId) // Don't update the current transaction (it already has the name)
        .select("id");

      if (updatePrevError) {
        console.error(
          "Failed to update name on previous transactions:",
          updatePrevError
        );
      } else if (updatedTxs && updatedTxs.length > 0) {
        
      }
    }

    // If receiver sends money back to sender, update sender_name in ALL matching previous transactions
    // When B sends to A with name, find ALL transactions where A was sender and B was receiver, update A's sender_name
    // This ensures the name is consistent across all previous transactions between these two users
    // Note: Future transactions will automatically use this name via the check above (nameToUseForSenderName)
    if (name && transactionId && receiver_id) {
      // Update ALL previous transactions where:
      // - current receiver was the sender (receiver_id was sender_profile_id)
      // - current sender was the receiver (sender_id was receiver_profile_id)
      // This updates the sender_name field in previous transactions where current sender was the receiver
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
        
      }
    }

    // Fetch updated sender wallet balance so frontend can update Redux
    const { data: senderWallet, error: walletError } = await supabase
      .from("wallets")
      .select("balance, currency")
      .eq("user_id", sender_id)
      .maybeSingle();

    // Send push notifications (non-blocking)
    
    if (transactionId) {
      // Get receiver_id from transaction if it wasn't provided (phone number transfer)
      let actualReceiverId = receiver_id;
      
      if (!actualReceiverId && transactionId) {
        // Look up receiver_id from the transaction
        const { data: transaction, error: txError } = await supabase
          .from("transactions")
          .select("receiver_profile_id")
          .eq("id", transactionId)
          .single();
        
        if (txError) {
          console.error("Error fetching transaction:", txError);
        }
        
        
        if (transaction?.receiver_profile_id) {
          actualReceiverId = transaction.receiver_profile_id;
        } else {
          console.warn("Transaction found but no receiver_profile_id");
        }
      } else {
      }

      // Get environment variables for notifications (needed for both receiver and sender)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
   
      
      if (!supabaseUrl) {
        console.error("❌ NEXT_PUBLIC_SUPABASE_URL is not set!");
      }
      if (!serviceRoleKey) {
        console.error("❌ SUPABASE_SERVICE_ROLE_KEY is not set!");
      }

      // Only send notifications if we have a receiver_id
      if (actualReceiverId) {
        // Get receiver and sender details for notifications
        const [{ data: receiverDetails }, { data: senderDetails }] = await Promise.all([
          supabase
            .from("user_details")
            .select("id, name")
            .eq("id", actualReceiverId)
            .single(),
          supabase
            .from("user_details")
            .select("id, name")
            .eq("id", sender_id)
            .single(),
        ]);

        const receiverName = name || receiverDetails?.name || "Someone";
        const senderName = sender_name || senderDetails?.name || "Someone";
        const formattedAmount = `$${parseFloat(amount).toFixed(2)}`;

        // Send notification to receiver (payment received)
        
        const notificationUrl = `${supabaseUrl}/functions/v1/send-push-notification`;
        
        const notificationPayload = {
          userId: actualReceiverId,
          title: "Payment Received",
          body: `You received ${formattedAmount} from ${senderName}`,
          data: {
            transactionId: transactionId.toString(),
            type: "receive",
            amount: amount.toString(),
            counterparty: senderName,
          },
        };
        
        try {
          const fetchStartTime = Date.now();
          const response = await fetch(notificationUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify(notificationPayload),
          });
          
          const fetchDuration = Date.now() - fetchStartTime;
         
          const result = await response.json();
         
          if (!response.ok) {
            console.error("❌ Push notification failed!");
            console.error("Status:", response.status);
            console.error("Error:", result);
          } else if (result.error) {
            console.error("❌ Push notification returned error:", result.error);
          } else {
          }
        } catch (err: any) {
          console.error("❌ Exception sending push notification to receiver:");
          console.error("Error type:", err?.constructor?.name);
          console.error("Error message:", err?.message);
          console.error("Error stack:", err?.stack);
          console.error("Full error:", err);
        }
      } else {
        console.warn("⚠️ Cannot send notification: receiver_id not found for transaction:", transactionId);
        console.warn("Transaction ID:", transactionId);
        console.warn("Receiver ID:", receiver_id);
        console.warn("Receiver Phone:", receiver_phone);
      }

      // Send notification to sender (payment sent) - optional, can be removed if not needed
      // Get sender details for notification
      const { data: senderDetailsForNotification } = await supabase
        .from("user_details")
        .select("id, name")
        .eq("id", sender_id)
        .single();

      const senderNameForNotification = sender_name || senderDetailsForNotification?.name || "Someone";
      const receiverNameForSender = name || "Someone";
      const formattedAmountForSender = `$${parseFloat(amount).toFixed(2)}`;
      
      const senderNotificationUrl = `${supabaseUrl}/functions/v1/send-push-notification`;
    
      
      const senderPayload = {
        userId: sender_id,
        title: "Payment Sent",
        body: `You sent ${formattedAmountForSender} to ${receiverNameForSender}`,
        data: {
          transactionId: transactionId.toString(),
          type: "send",
          amount: amount.toString(),
          counterparty: receiverNameForSender,
        },
      };
      
      
      try {
        const senderResponse = await fetch(senderNotificationUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify(senderPayload),
        });
        
        const senderResult = await senderResponse.json();
        
        if (!senderResponse.ok) {
          console.error("❌ Sender push notification failed!");
          console.error("Status:", senderResponse.status);
          console.error("Error:", senderResult);
        } else if (senderResult.error) {
          console.error("❌ Sender push notification returned error:", senderResult.error);
        } else {
          
        }
      } catch (err: any) {
        console.error("❌ Exception sending push notification to sender:", err);
      }
    } else {
      console.error("❌ Transaction ID is missing or falsy!");
      console.error("Transaction ID value:", transactionId);
      console.error("Transaction ID type:", typeof transactionId);
    }

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
