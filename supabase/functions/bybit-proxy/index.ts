import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BYBIT_BASE = "https://api.bybit.com";

function signRequest(
  apiKey: string,
  apiSecret: string,
  timestamp: string,
  recvWindow: string,
  queryString: string
): string {
  const preSign = timestamp + apiKey + recvWindow + queryString;
  return createHmac("sha256", apiSecret).update(preSign).digest("hex");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("BYBIT_API_KEY");
  const apiSecret = Deno.env.get("BYBIT_API_SECRET");

  if (!apiKey || !apiSecret) {
    return new Response(
      JSON.stringify({ error: "Bybit API credentials not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { endpoint, params = {} } = await req.json();

    if (!endpoint || typeof endpoint !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid endpoint parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Public endpoints don't need auth
    const isPublic = endpoint.startsWith("/v5/market/");

    const queryString = new URLSearchParams(params).toString();
    const url = `${BYBIT_BASE}${endpoint}${queryString ? "?" + queryString : ""}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (!isPublic) {
      const timestamp = Date.now().toString();
      const recvWindow = "5000";
      const sign = signRequest(apiKey, apiSecret, timestamp, recvWindow, queryString);
      headers["X-BAPI-API-KEY"] = apiKey;
      headers["X-BAPI-SIGN"] = sign;
      headers["X-BAPI-TIMESTAMP"] = timestamp;
      headers["X-BAPI-RECV-WINDOW"] = recvWindow;
    }

    const response = await fetch(url, { headers });
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.ok ? 200 : response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Bybit proxy error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
