import { json } from "@remix-run/node";
import prisma from "../db.server";
import { apiVersion } from "../shopify.server";

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
    const colorPrimary = formData.colorPrimary || '#000000';
    const colorSecondary = formData.colorSecondary || '#ffffff';
    const colorTertiary = formData.colorTertiary || '#f4f6f8';
    const colorQuaternary = formData.colorQuaternary || '#7983e61a';
    const fontPrimary = formData.fontPrimary || null;
    const fontSecondary = formData.fontSecondary || null;
    const fontTertiary = formData.fontTertiary || null;
    // Handle optional uploaded images: prefer uploaded image file (logoutImage/deleteImage)
    // converted to data URLs; otherwise use provided SVG text fields.
    const logoutFile = data.get('logoutImage');
    const deleteFile = data.get('deleteImage');
    const noOrdersFile = data.get('noOrdersImage');

    // Use undefined to indicate "no change" (omit from update). Use null to explicitly clear.
    let logoutSvg;
    if (logoutFile && typeof logoutFile.arrayBuffer === 'function' && logoutFile.size) {
      const buffer = Buffer.from(await logoutFile.arrayBuffer());
      const mime = logoutFile.type || 'image/png';
      logoutSvg = `data:${mime};base64,${buffer.toString('base64')}`;
    } else if (data.has('logoutSvg')) {
      logoutSvg = data.get('logoutSvg') || null;
    } else {
      logoutSvg = undefined;
    }

    let deleteSvg;
    if (deleteFile && typeof deleteFile.arrayBuffer === 'function' && deleteFile.size) {
      const buffer2 = Buffer.from(await deleteFile.arrayBuffer());
      const mime2 = deleteFile.type || 'image/png';
      deleteSvg = `data:${mime2};base64,${buffer2.toString('base64')}`;
    } else if (data.has('deleteSvg')) {
      deleteSvg = data.get('deleteSvg') || null;
    } else {
      deleteSvg = undefined;
    }

    let noOrdersImage;
    if (noOrdersFile && typeof noOrdersFile.arrayBuffer === 'function' && noOrdersFile.size) {
      const buffer3 = Buffer.from(await noOrdersFile.arrayBuffer());
      const mime3 = noOrdersFile.type || 'image/png';
      noOrdersImage = `data:${mime3};base64,${buffer3.toString('base64')}`;
    } else if (data.has('noOrdersSvg')) {
      noOrdersImage = data.get('noOrdersSvg') || null;
    } else {
      noOrdersImage = undefined;
    }
    const url = new URL(request.url);
    let storeUrl = url.searchParams.get("storeUrl") || "";
    // Check if script is already wrapped to prevent double-wrapping
    const isAlreadyWrapped = scriptInput && scriptInput.includes('(function customOrderCancelScript(){try{(0,eval)');
    const script =
      cancelOrderBehavior === "script" && scriptInput && !isAlreadyWrapped
        // Wrap the admin-provided script as a string and evaluate it when run.
        // We JSON.stringify the scriptInput so any quotes/backticks/newlines are
        // safely escaped when stored as a wrapper script. The wrapper will
        // perform an eval on that string at runtime so admin code runs as
        // intended without breaking the surrounding JS.
        ? `(function customOrderCancelScript(){try{(0,eval)(${JSON.stringify(scriptInput)})}catch(e){console.error("Admin script failed", e);}})();`
        : (cancelOrderBehavior === "script" && scriptInput ? scriptInput : null);
   
    // Build updateData and only include image fields when they were provided (or explicitly cleared)
    const updateData = {
      menuTabs,
      cancelOrderBehavior,
      script,
      colorPrimary,
      colorSecondary,
      colorTertiary,
      colorQuaternary,
      fontPrimary,
      fontSecondary,
      fontTertiary,
    };
    if (logoutSvg !== undefined) updateData.logoutSvg = logoutSvg;
    if (deleteSvg !== undefined) updateData.deleteSvg = deleteSvg;
    if (noOrdersImage !== undefined) updateData.noOrdersImage = noOrdersImage;

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

    console.log("[apimenu] saved menu settings", {
      shop: storeUrl,
      colorPrimary: result.colorPrimary,
      colorSecondary: result.colorSecondary,
      colorTertiary: result.colorTertiary,
      colorQuaternary: result.colorQuaternary,
      fontPrimary: result.fontPrimary,
      fontSecondary: result.fontSecondary,
      fontTertiary: result.fontTertiary,
      logoutSvg: result.logoutSvg ? "[svg set]" : null,
      deleteSvg: result.deleteSvg ? "[svg set]" : null,
      noOrdersImage: result.noOrdersImage ? "[image set]" : null,
      updatedAt: result.updatedAt,
    });

    return json({ reply: result }, { headers: getCorsHeaders(request) });

  } catch (error) {
    console.error("API Error:", error);
    return json({ message: "Internal Server Error" }, { status: 500, headers: getCorsHeaders(request) });
  }
};

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
        colorPrimary: "#000000",
        colorSecondary: "#ffffff",
        colorQuaternary: "#7983e6",
        colorTertiary: "#f4f6f8",
        fontPrimary: null,
        fontSecondary: null,
        fontTertiary: null,
        logoutSvg: null,
        deleteSvg: null,
        noOrdersImage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }, { headers: getCorsHeaders(request) });

  } catch (error) {
    console.error("Loader Error:", error);
    return json({ message: "Internal Server Error" }, { status: 500, headers: getCorsHeaders(request) });
  }
};