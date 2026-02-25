import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { mobile_number, country_code } = await request.json();

    if (!mobile_number) {
      return NextResponse.json(
        { error: "mobile number is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user_details")
      .insert({
        mobile_number,
        full_number: country_code + mobile_number,
        country_code,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ user: data }, { status: 201 });
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
    const { mobile_number, pin, country_code } = await request.json();

    if (!mobile_number || !pin || !country_code) {
      return NextResponse.json(
        { error: "mobile_number, pin and country_code are required" },
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
      .eq("mobile_number", mobile_number)
      .eq("country_code", country_code)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "User not found for given mobile_number and country_code" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: data }, { status: 200 });
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
    const mobile_number = searchParams.get("mobile_number");
    const country_code = searchParams.get("country_code");

    if (!mobile_number || !country_code) {
      return NextResponse.json(
        { error: "mobile_number and country_code are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("user_details")
      .select("*")
      .eq("mobile_number", mobile_number)
      .eq("country_code", country_code)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "User not found for given mobile number " },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: data }, { status: 200 });
  } catch (error) {
    console.error("Error getting user_details record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
