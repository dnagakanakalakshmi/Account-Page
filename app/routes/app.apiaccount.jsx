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
    const id = body.id;
    const firstName = body.firstName;
    const lastName = body.lastName;
    const phone = body.phone;
    const gender = body.gender;
    const dob = body.dob;
    const storeUrl = body.storeUrl
    const mutation = {
      query: `
      mutation customerUpdate($input: CustomerInput!) {
        customerUpdate(input: $input) {
          customer {
            id
            firstName
            lastName
            phone
            metafields(first: 10) {
              edges {
                node {
                  id
                  namespace
                  key
                  value
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
      variables: {
        input: {
          id: `gid://shopify/Customer/${id}`,
          firstName,
          lastName,
          phone,
          metafields: [
            {
              namespace: "profile",
              key: "gender",
              type: "single_line_text_field",
              value: gender || ""
            },
            {
              namespace: "profile",
              key: "dob",
              type: "single_line_text_field",
              value: dob || ""
            }
          ]
        }
      }
    };

    const storeHostname = new URL(storeUrl).hostname; 
    const session = await prisma.session.findFirst({
      where: { shop: storeHostname},
      orderBy: { expires: "desc" }
    });

    if (!session || !session.accessToken) {
      return json({ error: "Authentication required. Please reinstall the app." }, {
        status: 401,
        headers: getCorsHeaders(request)
      });
    }
    const accessToken =session.accessToken

    try {

      const response = await fetch(`https://${storeHostname}/admin/api/${apiVersion}/graphql.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": `${accessToken}`,
        },
        body: JSON.stringify(mutation)
      });
      const result = await response.json();
      if (result.data?.customerUpdate?.userErrors?.length) {
        return json(
          { success: false, message: result.data.customerUpdate.userErrors },
          { headers: getCorsHeaders(request) }
        );
      }
      return json(
        { success: true, customer: result.data.customerUpdate.customer },
        { headers: getCorsHeaders(request) }
      );
    } catch (err) {
      console.log(err);
      return json(
        { message: "Internal Server Error" },
        { status: 500, headers: getCorsHeaders(request) }
      );
    }
  } catch (error) {
    console.error("Error in updating profile:", error);
    return json(
      { message: "Internal Server Error" },
      { status: 500, headers: getCorsHeaders(request) }
    );
  }
};

export const loader = async ({ request }) => {
  // Handle CORS preflight for this route. Remix routes without a loader
  // can't respond to OPTIONS requests, so provide a minimal loader.
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(request) });
  }

  return json({ message: 'Method Not Allowed' }, { status: 405, headers: getCorsHeaders(request) });
};