import type { LoaderFunctionArgs } from "react-router";
import clientPromise from "../mongodb.server";

export async function loader({ request }: LoaderFunctionArgs) {
try {
const url = new URL(request.url);


const pincode = url.searchParams.get("pincode")?.trim();
const city = url.searchParams.get("city")?.trim();
const successParam = url.searchParams.get("success");
const limitParam = url.searchParams.get("limit");

const limit = Math.min(
  Math.max(Number(limitParam) || 10, 1),
  100,
);

const filter: Record<string, unknown> = {};

if (pincode) {
  filter.pincode = pincode;
}

if (city) {
  filter.city = city;
}

if (successParam === "true") {
  filter.success = true;
} else if (successParam === "false") {
  filter.success = false;
}

const client = await clientPromise;

const db = client.db("pincode_checker");
const collection = db.collection("analytics");

const analytics = await collection
  .find(filter)
  .sort({ timestamp: -1 })
  .limit(limit)
  .toArray();

return Response.json({
  success: true,
  count: analytics.length,
  filters: {
    pincode: pincode || null,
    city: city || null,
    success:
      successParam === "true"
        ? true
        : successParam === "false"
          ? false
          : null,
    limit,
  },
  data: analytics,
});


} catch (error) {
console.error("Analytics API error:", error);


return Response.json(
  {
    success: false,
    message: "Unable to fetch analytics data.",
  },
  {
    status: 500,
  },
);


}
}
