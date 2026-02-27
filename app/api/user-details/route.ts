import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function sanitizeUser(user: any) {
  const { pin, ...safeUser } = user || {};
  return safeUser;
}

export async function POST(request: Request) {
  try {
    const { mobile_number, country_code, email } = await request.json();

    if (!mobile_number) {
      return NextResponse.json(
        { error: "mobile number is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if a user with this mobile_number + country_code already exists
    const { data: existingUser, error: existingError } = await supabase
      .from("user_details")
      .select("*")
      .eq("mobile_number", mobile_number)
      .eq("country_code", country_code)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { error: existingError.message },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("user_details")
      .insert({
        mobile_number,
        full_number: country_code + mobile_number,
        country_code,
        email,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Newly created user -> ensure they have a wallet (creates with 2500 if absent)
    const { data: wallet, error: walletError } = await supabase.rpc(
      "ensure_wallet",
      {
        p_user_id: data.id,
      }
    );

    if (walletError) {
      return NextResponse.json({ error: walletError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        user: sanitizeUser(data),
        wallet_balance: wallet.balance,
        wallet_id: wallet.id,
        wallet_currency: wallet.currency,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user_details record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, pin } = await request.json();

    if (!id || !pin) {
      return NextResponse.json(
        { error: "id and pin are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user_details")
      .update({
        pin,
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "User not found for given id" },
        { status: 404 }
      );
    }

    // Ensure wallet exists and return wallet info with the user
    const { data: wallet, error: walletError } = await supabase.rpc(
      "ensure_wallet",
      {
        p_user_id: data.id,
      }
    );

    if (walletError) {
      return NextResponse.json({ error: walletError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        user: sanitizeUser(data),
        wallet_balance: wallet.balance,
        wallet_id: wallet.id,
        wallet_currency: wallet.currency,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user_details PIN:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const mobile_number = searchParams.get("mobile_number");
    const country_code = searchParams.get("country_code");

    if (!id && (!mobile_number || !country_code)) {
      return NextResponse.json(
        { error: "id or (mobile_number and country_code) are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    let query = supabase.from("user_details").select("*");

    if (id) {
      query = query.eq("id", id);
    } else {
      query = query
        .eq("mobile_number", mobile_number)
        .eq("country_code", country_code);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "User not found for given mobile number " },
        { status: 404 }
      );
    }

    // Ensure wallet exists and return wallet info with the user
    const { data: wallet, error: walletError } = await supabase.rpc(
      "ensure_wallet",
      {
        p_user_id: data.id,
      }
    );

    if (walletError) {
      return NextResponse.json({ error: walletError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        user: sanitizeUser(data),
        wallet_balance: wallet.balance,
        wallet_id: wallet.id,
        wallet_currency: wallet.currency,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting user_details record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
