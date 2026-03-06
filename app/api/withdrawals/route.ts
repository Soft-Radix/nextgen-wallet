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
      .from("withdrawals")
      .select("id, uuid, amount, created_at")
      .eq("uuid", user_id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    let items =
      data?.map((w) => ({
        id: w.id,
        amount: Number(w.amount) || 0,
        status: "Completed",
        created_at: w.created_at,
        transaction_type: "withdrawal" as const,
        type: "outgoing" as const,
        sender_mobile: null,
        receiver_mobile: null,
        counterparty_mobile: "ATM Withdrawal",
      })) ?? [];

    if (typeof search === "string" && search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((item) => {
        const amountStr = String(item.amount);
        const dateStr = item.created_at ? String(item.created_at) : "";
        return (
          amountStr.toLowerCase().includes(q) ||
          dateStr.toLowerCase().includes(q)
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
    console.error("withdrawals list POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

