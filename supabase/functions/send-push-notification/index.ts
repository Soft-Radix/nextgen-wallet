// @ts-nocheck - Deno URL imports work at runtime in Supabase Edge Functions
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Flow: Supabase API Route → Firebase Admin SDK → FCM v1 → System Notification

// Type declaration for Deno global (Supabase Edge Functions runtime)
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

interface NotificationPayload {
  userId?: string;
  token?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

function normalizeFcmToken(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (
    !normalized ||
    normalized === "undefined" ||
    normalized === "null"
  ) {
    return null;
  }

  return normalized;
}

function uniqueTokens(values: unknown[]): string[] {
  return [...new Set(values.map(normalizeFcmToken).filter(Boolean))] as string[];
}

/* ---------------- BASE64 URL ---------------- */
function base64url(input: Uint8Array | string): string {
  let str =
    typeof input === "string"
      ? btoa(input)
      : btoa(String.fromCharCode(...input));

  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/* ---------------- PEM → ARRAY BUFFER ---------------- */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const base64 = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\n/g, "");

  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }

  return buffer.buffer;
}

/* ---------------- CREATE JWT ---------------- */
async function createJWT(
  clientEmail: string,
  privateKey: string
): Promise<string> {
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);

  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));

  const data = `${encodedHeader}.${encodedPayload}`;

  const keyData = pemToArrayBuffer(privateKey);

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(data)
  );

  return `${data}.${base64url(new Uint8Array(signature))}`;
}

/* ---------------- EDGE FUNCTION ---------------- */
serve(async (req: Request) => {

  try {
    // Handle CORS
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers":
            "authorization, x-client-info, apikey, content-type",
        },
      });
    }

    // Parse request body
    const payload: NotificationPayload = await req.json();
    const { userId, token, title, body, data } = payload;

    // Validate required fields
    if (!title || !body) {
      console.error("Validation failed: Missing title or body", {
        title,
        body,
      });
      return new Response(
        JSON.stringify({ error: "Missing required fields: title, body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Must provide either userId or token
    if (!userId && !token) {
      console.error("Validation failed: Missing userId and token");
      return new Response(
        JSON.stringify({ error: "Missing required field: userId or token" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let fcmTokens: string[] = [];

    // If token is provided directly, use it; otherwise look up by userId
    if (token) {
      const normalizedToken = normalizeFcmToken(token);

      if (!normalizedToken) {
        return new Response(
          JSON.stringify({
            error: "Invalid FCM token provided in request.",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      fcmTokens = [normalizedToken];
    } else if (userId) {
      // Initialize Supabase client
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const supabaseServiceKey =
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

      if (!supabaseUrl || !supabaseServiceKey) {
        console.error("Missing Supabase credentials", {
          supabaseUrl: !!supabaseUrl,
          supabaseServiceKey: !!supabaseServiceKey,
        });
        return new Response(
          JSON.stringify({ error: "Supabase configuration missing" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Load several recent tokens and pick the newest valid one.
      const { data: tokenRows, error: tokenError } = await supabase
        .from("fcm_tokens")
        .select("token, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (tokenError) {
        console.error("Error fetching FCM token:", tokenError);
        return new Response(
          JSON.stringify({
            error: "Error fetching FCM token",
            details: tokenError.message,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const candidateTokens = uniqueTokens(
        (tokenRows || []).map((row) => row?.token)
      );

      if (candidateTokens.length === 0) {
        console.error("No valid FCM token found for user", {
          userId,
          rowCount: tokenRows?.length || 0,
        });
        return new Response(
          JSON.stringify({
            error:
              "FCM token not available for this user. Please ensure notifications are enabled.",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      fcmTokens = candidateTokens;
    } else {
      return new Response(
        JSON.stringify({
          error: "Invalid request: must provide userId or token",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get Firebase credentials from separate environment variables
    // Support both new format (separate secrets) and old format (FIREBASE_ADMIN_SDK JSON)
    let clientEmail: string | undefined;
    let privateKeyRaw: string | undefined;
    let projectId: string | undefined;

    // Try new format first (separate secrets)
    clientEmail = Deno.env.get("FIREBASE_CLIENT_EMAIL");
    privateKeyRaw = Deno.env.get("FIREBASE_PRIVATE_KEY");
    projectId = Deno.env.get("FIREBASE_PROJECT_ID");

    // Fallback to old format (FIREBASE_ADMIN_SDK JSON) if new format not available
    if (!clientEmail || !privateKeyRaw || !projectId) {
      const FIREBASE_ADMIN_SDK = Deno.env.get("FIREBASE_ADMIN_SDK");

      if (FIREBASE_ADMIN_SDK) {
        try {
          const serviceAccount =
            typeof FIREBASE_ADMIN_SDK === "string"
              ? JSON.parse(FIREBASE_ADMIN_SDK)
              : FIREBASE_ADMIN_SDK;

          clientEmail = serviceAccount.client_email || clientEmail;
          privateKeyRaw = serviceAccount.private_key || privateKeyRaw;
          projectId = serviceAccount.project_id || projectId;

          // Try to extract project_id from client_email if still missing
          if (!projectId && clientEmail) {
            const emailMatch = clientEmail.match(/@([^.]+)\./);
            if (emailMatch && emailMatch[1]) {
              projectId = emailMatch[1];
            }
          }

          // Hardcoded fallback
          if (!projectId) {
            projectId = "nextgen-ef808";
          }
        } catch (e) {
          console.error("❌ Failed to parse FIREBASE_ADMIN_SDK:", e);
        }
      }
    }

    // Final validation
    if (!clientEmail) {
      console.error("❌ FIREBASE_CLIENT_EMAIL secret not found!");
      return new Response(
        JSON.stringify({
          error:
            "Firebase configuration missing: FIREBASE_CLIENT_EMAIL not set. Please set this secret in Supabase.",
          troubleshooting:
            "Set FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, and FIREBASE_PROJECT_ID secrets, OR set FIREBASE_ADMIN_SDK with full JSON",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!privateKeyRaw) {
      console.error("❌ FIREBASE_PRIVATE_KEY secret not found!");
      return new Response(
        JSON.stringify({
          error:
            "Firebase configuration missing: FIREBASE_PRIVATE_KEY not set. Please set this secret in Supabase.",
          troubleshooting:
            "Set FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, and FIREBASE_PROJECT_ID secrets, OR set FIREBASE_ADMIN_SDK with full JSON",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!projectId || projectId === "undefined") {
      console.error("❌ FIREBASE_PROJECT_ID secret not found or is undefined!");
      console.error("Project ID value:", projectId);
      console.error("Project ID type:", typeof projectId);
      return new Response(
        JSON.stringify({
          error:
            "Firebase configuration missing: FIREBASE_PROJECT_ID not set or is undefined.",
          troubleshooting:
            "Set FIREBASE_PROJECT_ID='nextgen-ef808' secret in Supabase, OR ensure FIREBASE_ADMIN_SDK contains 'project_id' field",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Replace escaped newlines in private key
    const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

    // Create JWT
    const jwt = await createJWT(clientEmail, privateKey);

    // Get access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error("Failed to get access token:", errorText);
      return new Response(
        JSON.stringify({
          error: "Failed to get OAuth2 access token",
          details: errorText,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { access_token } = await tokenRes.json();

    // Final safety check - ensure projectId is valid before making API call
    if (
      !projectId ||
      projectId === "undefined" ||
      typeof projectId !== "string"
    ) {
      console.error("❌ CRITICAL: projectId is invalid before FCM API call!");
      console.error("Project ID value:", projectId);
      console.error("Project ID type:", typeof projectId);
      return new Response(
        JSON.stringify({
          error: "Invalid project_id configuration",
          details: `project_id is ${projectId} (type: ${typeof projectId}). Must be a valid string.`,
          troubleshooting:
            "Please set FIREBASE_PROJECT_ID='nextgen-ef808' in Supabase secrets, or ensure FIREBASE_ADMIN_SDK contains valid project_id field",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Send notification via FCM v1 REST API
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
   

    let lastErrorText = "";
    let lastStatus = 500;

    for (const [index, fcmToken] of fcmTokens.entries()) {
      
      const fcmResponse = await fetch(fcmUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token: fcmToken,
            notification: {
              title,
              body,
            },
            data: data || {},
            webpush: {
              notification: {
                title,
                body,
              },
            },
            android: {
              priority: "high",
            },
            apns: {
              headers: {
                "apns-priority": "10",
              },
            },
          },
        }),
      });

     
      if (fcmResponse.ok) {
        const fcmResult = await fcmResponse.json();
       
        return new Response(
          JSON.stringify({ success: true, messageId: fcmResult.name }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      lastStatus = fcmResponse.status;
      lastErrorText = await fcmResponse.text();
      console.error("FCM v1 API error:", lastErrorText);
    }

    return new Response(
      JSON.stringify({
        error: "Failed to send push notification via FCM v1",
        details: lastErrorText || "No valid FCM token candidates succeeded.",
      }),
      {
        status: lastStatus >= 400 ? lastStatus : 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("=== ERROR ===");
    console.error("Error type:", error?.constructor?.name);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);
    console.error(
      "Full error:",
      JSON.stringify(error, Object.getOwnPropertyNames(error))
    );
    return new Response(
      JSON.stringify({
        error: error?.message || "Internal server error",
        details: error?.stack || String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
