import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getCorsHeaders(request) {
  // Echo the Origin back if present, otherwise allow any origin.
  const origin = request && request.headers && request.headers.get
    ? request.headers.get('origin') || '*'
    : '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// export const action = async ({ request }) => {
//   try {
//     const data = await request.formData();
//     const formData = Object.fromEntries(data.entries());
//     const menuTabs = JSON.parse(formData.menuTabs || '[]');
//     const cancelOrderBehavior = formData.cancelOrderBehavior || 'direct';
//     const scriptInput = formData.scriptInput || '';
//     const script =
//     cancelOrderBehavior === "script" && scriptInput
//       ? `(function customOrderCancelScript() {\n  try {\n${scriptInput}\n  } catch (e) {\n    console.error("Admin script failed", e);\n  }\n})();`
//       : null;
//     const { session } = await shopify.authenticate.admin(request);
//     const { shop } = session;
//     const updateData = {
//       menuTabs,
//       cancelOrderBehavior,
//       script,
//       updatedAt: new Date(),
//     };

//     let existing = await prisma.MenuSettings.findUnique({ where: {id: "singleton", shop } });

//     const result = existing
//       ? await prisma.MenuSettings.update({
//           where: { id: "singleton",
//           shop
//            },
//           data: updateData,
//         })
//       : await prisma.MenuSettings.create({
//           data: { id: "singleton",shop, ...updateData },
//         });

//     return json({ reply: result });

//   } catch (error) {
//     console.error("API Error:", error);
//     return json({ message: "Internal Server Error" }, { status: 500 });
//   }
// };


export const action = async ({ request }) => {
  try {
    // Respond to CORS preflight immediately
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: getCorsHeaders(request) });
    }
    const data = await request.formData();
    const formData = Object.fromEntries(data.entries());
    const menuTabs = JSON.parse(formData.menuTabs || '[]');
    const cancelOrderBehavior = formData.cancelOrderBehavior || 'direct';
    const scriptInput = formData.scriptInput || '';
    const url = new URL(request.url);
    let storeUrl = url.searchParams.get("storeUrl") || "";
    const script =
      cancelOrderBehavior === "script" && scriptInput
        // Wrap the admin-provided script as a string and evaluate it when run.
        // We JSON.stringify the scriptInput so any quotes/backticks/newlines are
        // safely escaped when stored as a wrapper script. The wrapper will
        // perform an eval on that string at runtime so admin code runs as
        // intended without breaking the surrounding JS.
        ? `(function customOrderCancelScript(){try{(0,eval)(${JSON.stringify(scriptInput)})}catch(e){console.error("Admin script failed", e);}})();`
        : null;
   
    const updateData = {
      menuTabs,
      cancelOrderBehavior,
      script,
    };

    const existing = await prisma.menuSettings.findFirst({
      where: { shop : storeUrl },
    });

    const result = existing
      ? await prisma.menuSettings.update({
        where: { id: existing.id },
        data: updateData,
      })
      : await prisma.menuSettings.create({
        data: {
          id: `singleton_${storeUrl}`, 
          shop: storeUrl,
          ...updateData,
        },
      });

    return json({ reply: result }, { headers: getCorsHeaders(request) });

  } catch (error) {
    console.error("API Error:", error);
    return json({ message: "Internal Server Error" }, { status: 500, headers: getCorsHeaders(request) });
  }
};

// export const loader = async () => {
//   try {
//     const settings = await prisma.MenuSettings.findFirst({
//       where: { id: "singleton" },
//     });

//     const defaultTabs = [
//       { key: "accountDetails", label: "Account Details", enabled: true },
//       { key: "addresses", label: "Addresses", enabled: true },
//       { key: "orders", label: "Orders", enabled: true },
//       { key: "wishlist", label: "Wishlist", enabled: false, link: "/pages/wishlist" },
//       { key: "subscriptions", label: "Subscriptions", enabled: false, link: "/pages/subscriptions" }
//     ];

//     return json({
//       reply: settings || {
//         id: "singleton",
//         menuTabs: defaultTabs,
//         cancelOrderBehavior: "direct",
//         script: null,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       }
//     });

//   } catch (error) {
//     console.error("Loader Error:", error);
//     return json({ message: "Internal Server Error" }, { status: 500 });
//   }
// };

export const loader = async ({ request }) => {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(request) });
  }
  const url = new URL(request.url);
  let storeUrl = url.searchParams.get("storeUrl") || "";
  try {
    const settings = await prisma.menuSettings.findFirst({
      where: { shop : storeUrl },
    });

    const defaultTabs = [
      { key: "accountDetails", label: "Account Details", enabled: true },
      { key: "addresses", label: "Addresses", enabled: true },
      { key: "orders", label: "Orders", enabled: true },
      { key: "wishlist", label: "Wishlist", enabled: false, link: "/pages/wishlist" },
      { key: "subscriptions", label: "Subscriptions", enabled: false, link: "/pages/subscriptions" }
    ];

    return json({
      reply: settings || {
        id: `singleton_${storeUrl}`,
        shop: storeUrl,
        menuTabs: defaultTabs,
        cancelOrderBehavior: "direct",
        script: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }, { headers: getCorsHeaders(request) });

  } catch (error) {
    console.error("Loader Error:", error);
    return json({ message: "Internal Server Error" }, { status: 500, headers: getCorsHeaders(request) });
  }
};