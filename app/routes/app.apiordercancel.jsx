import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";
import shopify from "../shopify.server"

const prisma = new PrismaClient();

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
    });

    if (!latestSession?.accessToken) {
      return json(
        { success: false, message: "Admin session or access token not found." },
        { status: 401, headers: getCorsHeaders(request) }
      );
    }

    const response = await fetch(
      `https://${storeHostname}/admin/api/2023-10/orders/${orderId}/cancel.json`,
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

// export const action = async ({ request }) => {
//     try {
//         const body = await request.json();
//         console.log("body", body)
//         const id = body.orderId;

//         const type = await prisma.cancelOrderType.findFirst();
//         console.log("cancel type",type);
//         if(type.cancelOrderBehavior=="script"){
//             return json(
//                     { success: false, redirection: true },
//                     { headers: { "Access-Control-Allow-Origin": "*" } }
//             );
//         }

//         const session = await prisma.session.findFirst({
//             orderBy: { expires: "desc" },
//         });
//         if (!session || !session.accessToken) {
//             throw new Error("Admin access token not found.");
//         }
//         const shopDomain = session.shop;
//         const accessToken = session.accessToken;
//         try {
//             const response = await fetch(`https://${shopDomain}/admin/api/2023-10/orders/${id}/cancel.json`, {
//                 method: 'POST',
//                 headers: {
//                     "Content-Type": "application/json",
//                     "X-Shopify-Access-Token": `${accessToken}`,
//                 },
//             });

//             if (response.ok) {
//                 return json(
//                     { success: true },
//                     { headers: { "Access-Control-Allow-Origin": "*" } }
//                 );
//             } else {
//                 return json(
//                     { success: false },
//                     { headers: { "Access-Control-Allow-Origin": "*" } }
//                 );
//             }
//         } catch (err) {
//             console.log("api",err)
//             return json(
//                 { message: "Internal Server Error" },
//                 { headers: { "Access-Control-Allow-Origin": "*" } }
//             );
//         }
//     } catch (error) {
//         console.log(error)
//         return json(
//             { message: "Internal Server Error" },
//             { headers: { "Access-Control-Allow-Origin": "*" } }
//         );
//     }
// };