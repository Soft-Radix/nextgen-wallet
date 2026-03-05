import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 20;

export async function POST(request: Request) {
  try {
    const { user_id, page = 1, search } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    const currentPage = Number(page) > 0 ? Number(page) : 1;
    const from = (currentPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("transactions")
      .select("id, sender_profile_id, receiver_profile_id, amount, status, created_at, name, is_contact")
      .or(`sender_profile_id.eq.${user_id},receiver_profile_id.eq.${user_id}`)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const txList = data ?? [];

    // Collect unique profile IDs to look up phone numbers
    const profileIds = Array.from(
      new Set(
        txList
          .flatMap((t) => [t.sender_profile_id, t.receiver_profile_id])
          .filter((id): id is string | number => id != null)
      )
    );

    let phoneMap: Record<string, string | null> = {};

    if (profileIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from("user_details")
        .select("id, mobile_number")
        .in("id", profileIds);

      if (usersError) {
        console.error("transactions user_details lookup error:", usersError);
      } else {
        phoneMap = (users ?? []).reduce<Record<string, string | null>>(
          (acc, user) => {
            acc[String(user.id)] = user.mobile_number ?? null;
            return acc;
          },
          {}
        );
      }
    }

    let items =
      txList.map((tx) => {
        const isSender = String(tx.sender_profile_id) === String(user_id);
        const transactionType = isSender ? "sender" : "receiver";

        const senderPhone = phoneMap[String(tx.sender_profile_id)] ?? null;
        const receiverPhone = phoneMap[String(tx.receiver_profile_id)] ?? null;

        return {
          id: tx.id,
          amount: Number(tx.amount) || 0,
          status: tx.status ?? "Completed",
          created_at: tx.created_at,
          transaction_type: transactionType,
          type: isSender ? "outgoing" : "incoming",
          sender_profile_id: tx.sender_profile_id,
          receiver_profile_id: tx.receiver_profile_id,
          sender_mobile: senderPhone,
          receiver_mobile: receiverPhone,
          name: tx.name ?? null,
          is_contact: tx.is_contact ?? false,
          counterparty_mobile: transactionType === "sender" ? receiverPhone : senderPhone,
        };
      });

    if (typeof search === "string" && search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((item) => {
        const phone =
          item.counterparty_mobile ||
          item.sender_mobile ||
          item.receiver_mobile ||
          "";
        const status = item.status || "";
        return (
          phone.toLowerCase().includes(q) ||
          status.toLowerCase().includes(q)
        );
      });
    }

    return NextResponse.json(
      {
        items,
        page: currentPage,
        page_size: PAGE_SIZE,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("transactions POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

