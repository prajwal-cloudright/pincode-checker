import type { LoaderFunctionArgs } from "react-router";
import { saveDeliveryAnalytics } from "../models/analytics.server";

export async function loader({ request }: LoaderFunctionArgs) {
const url = new URL(request.url);
const pincode = url.searchParams.get("pincode")?.trim();

const headers = {
"Access-Control-Allow-Origin": "*",
"Access-Control-Allow-Methods": "GET, OPTIONS",
"Access-Control-Allow-Headers": "Content-Type",
"Content-Type": "application/json",
};

if (request.method === "OPTIONS") {
return new Response(null, {
status: 204,
headers,
});
}

if (!pincode || !/^\d{6}$/.test(pincode)) {
return Response.json(
{
success: false,
message: "Please enter a valid 6-digit pincode.",
},
{
status: 400,
headers,
},
);
}

try {
const indiaPostUrl =
"https://api.postalpincode.in/pincode/" +
encodeURIComponent(pincode);

const response = await fetch(indiaPostUrl);

if (!response.ok) {
  console.error(
    "India Post API HTTP error:",
    response.status,
    response.statusText,
  );

  try {
    await saveDeliveryAnalytics({
      pincode,
      city: null,
      timestamp: new Date(),
      success: false,
      deliveryCompanies: [],
    });

    console.log("Failure analytics saved successfully.");
  } catch (analyticsError) {
    console.error("Analytics save error:", analyticsError);
  }

  return Response.json(
    {
      success: false,
      message: "Unable to check pincode at the moment.",
    },
    {
      status: 502,
      headers,
    },
  );
}

const apiData = await response.json();

console.log("India Post API response:", apiData);

if (
  !Array.isArray(apiData) ||
  apiData.length === 0 ||
  apiData[0]?.Status !== "Success" ||
  !Array.isArray(apiData[0]?.PostOffice) ||
  apiData[0].PostOffice.length === 0
) {
  try {
    await saveDeliveryAnalytics({
      pincode,
      city: null,
      timestamp: new Date(),
      success: false,
      deliveryCompanies: [],
    });

    console.log("Failure analytics saved successfully.");
  } catch (analyticsError) {
    console.error("Analytics save error:", analyticsError);
  }

  return Response.json(
    {
      success: false,
      message: "Delivery unavailable for this pincode.",
      pincode,
    },
    {
      status: 404,
      headers,
    },
  );
}

const postOffice = apiData[0].PostOffice[0];

try {
  await saveDeliveryAnalytics({
    pincode,
    city: postOffice.District || null,
    timestamp: new Date(),
    success: true,
    deliveryCompanies: ["India Post"],
  });

  console.log("Analytics saved successfully.");
} catch (analyticsError) {
  console.error("Analytics save error:", analyticsError);
}

return Response.json(
  {
    success: true,
    message: "Delivery is Available",
    data: {
      pincode: postOffice.Pincode || pincode,
      postOffice: postOffice.Name || "N/A",
      district: postOffice.District || "N/A",
      state: postOffice.State || "N/A",
      deliveryStatus: postOffice.DeliveryStatus || "N/A",
    },
  },
  {
    status: 200,
    headers,
  },
);

} catch (error) {
console.error("Pincode API error:", error);

try {
  await saveDeliveryAnalytics({
    pincode,
    city: null,
    timestamp: new Date(),
    success: false,
    deliveryCompanies: [],
  });

  console.log("Failure analytics saved successfully.");
} catch (analyticsError) {
  console.error("Analytics save error:", analyticsError);
}

return Response.json(
  {
    success: false,
    message: "Unable to check delivery. Please try again.",
  },
  {
    status: 500,
    headers,
  },
);

}
}
