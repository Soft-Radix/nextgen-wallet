import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { id, kind } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    if (kind === "withdrawal") {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("id, uuid, amount, created_at")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      if (!data) {
        return NextResponse.json(
          { error: "Withdrawal not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          id: data.id,
          kind: "withdrawal",
          direction: "outgoing",
          amount: Number(data.amount) || 0,
          status: "Completed",
          created_at: data.created_at,
          sender_phone: null,
          receiver_phone: null,
          counterparty_phone: "ATM Withdrawal",
          note: null,
          reference: data.id,
        },
        { status: 200 }
      );
    }

    // Default: money transfer transaction
    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .select(
        "id, sender_profile_id, receiver_profile_id, amount, status, created_at, note, name"
      )
      .eq("id", id)
      .maybeSingle();

    if (txError) {
      return NextResponse.json(
        { error: txError.message },
        { status: 500 }
      );
    }

    if (!tx) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    const profileIds = [
      tx.sender_profile_id,
      tx.receiver_profile_id,
    ].filter((v): v is string | number => v != null);

    let phoneMap: Record<string, string | null> = {};
    let nameMap: Record<string, string | null> = {};

    if (profileIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from("user_details")
        .select("id, mobile_number, country_code, name")
        .in("id", profileIds);

      if (usersError) {
        console.error("transaction-details user_details lookup error:", usersError);
      } else {
        phoneMap = {};
        nameMap = {};
        (users ?? []).forEach((user: any) => {
          const key = String(user.id);
          const dial = user.country_code ?? "";
          const mobile = user.mobile_number ?? "";
          phoneMap[key] =
            dial || mobile ? `${dial}${mobile}` : mobile || null;
          nameMap[key] = user.name ?? null;
        });
      }
    }

    const senderPhone = phoneMap[String(tx.sender_profile_id)] ?? null;
    const receiverPhone = phoneMap[String(tx.receiver_profile_id)] ?? null;
    const senderName = nameMap[String(tx.sender_profile_id)] ?? null;
    const receiverName = nameMap[String(tx.receiver_profile_id)] ?? null;
    const txName = (tx as any).name ?? null;

    // Caller will infer direction (incoming/outgoing) from current user,
    // but we return the raw transaction.
    return NextResponse.json(
      {
        id: tx.id,
        kind: "transfer",
        amount: Number(tx.amount) || 0,
        status: tx.status ?? "Completed",
        created_at: tx.created_at,
        sender_phone: senderPhone,
        receiver_phone: receiverPhone,
        sender_name: senderName ?? txName,
        receiver_name: receiverName ?? txName,
        counterparty_phone: null,
        note: (tx as any).note ?? null,
        reference: tx.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("transaction-details POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

