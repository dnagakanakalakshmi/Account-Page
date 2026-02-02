import { json } from "@remix-run/node";
import prisma from "../db.server";
import { apiVersion } from "../shopify.server";

function getCorsHeaders(request) {
  const origin = request && request.headers && request.headers.get
    ? request.headers.get('origin') || '*'
    : '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}


export const action = async ({ request }) => {
  try {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: getCorsHeaders(request) });
    }
    const body = await request.json();
    const orderId = body.orderId;
    const storeUrl = body.storeUrl
    const storeHostname = new URL(storeUrl).hostname; // Get full hostname like "distaxstaging.myshopify.com"


    if (!orderId) {
      return json(
        { success: false, message: "Missing orderId" },
        { status: 400, headers: getCorsHeaders(request) }
      );
    }

    let cancelType = await prisma.cancelOrderType.findFirst({
      where: { storeHostname },
    });

    if (!cancelType) {
      cancelType = await prisma.cancelOrderType.create({
        data: {
          shop: storeHostname,
          cancelOrderBehavior: "direct",
          script: null,
        },
      });
    }

    if (cancelType?.cancelOrderBehavior === "script") {
      return json(
        { success: false, redirection: true },
        { headers: getCorsHeaders(request) }
      );
    }

    const latestSession = await prisma.session.findFirst({
      where: { shop : storeHostname },
      orderBy: { expires: "desc" }
    });

    if (!latestSession?.accessToken) {
      return json(
        { success: false, message: "Admin session or access token not found." },
        { status: 401, headers: getCorsHeaders(request) }
      );
    }

    const response = await fetch(
      `https://${storeHostname}/admin/api/${apiVersion}/orders/${orderId}/cancel.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": latestSession.accessToken,
        },
      }
    );

    if (response.ok) {
      return json(
        { success: true },
        { headers: getCorsHeaders(request) }
      );
    } else {
      const errorText = await response.text();
      console.error("Shopify cancel error:", errorText);
      return json(
        { success: false, message: "Failed to cancel the order." },
        { status: response.status || 500, headers: getCorsHeaders(request) }
      );
    }

  } catch (error) {
    console.error("Action error:", error);
    return json(
      { success: false, message: "Internal Server Error" },
      { status: 500, headers: getCorsHeaders(request) }
    );
  }
};
