import type { LoaderFunctionArgs } from "react-router";
import clientPromise from "../mongodb.server";

export async function loader({ request }: LoaderFunctionArgs) {
try {
const url = new URL(request.url);


const from = url.searchParams.get("from");
const to = url.searchParams.get("to");

const filter: Record<string, unknown> = {};

if (from || to) {
  const timestampFilter: Record<string, Date> = {};

  if (from) {
    const fromDate = new Date(`${from}T00:00:00.000Z`);

    if (isNaN(fromDate.getTime())) {
      return Response.json(
        {
          success: false,
          message: "Invalid from date. Use YYYY-MM-DD format.",
        },
        { status: 400 },
      );
    }

    timestampFilter.$gte = fromDate;
  }

  if (to) {
    const toDate = new Date(`${to}T23:59:59.999Z`);

    if (isNaN(toDate.getTime())) {
      return Response.json(
        {
          success: false,
          message: "Invalid to date. Use YYYY-MM-DD format.",
        },
        { status: 400 },
      );
    }

    timestampFilter.$lte = toDate;
  }

  filter.timestamp = timestampFilter;
}

const client = await clientPromise;

const db = client.db("pincode_checker");
const collection = db.collection("analytics");

const [
  totalChecks,
  successfulChecks,
  failedChecks,
  topPincodes,
  topCities,
] = await Promise.all([
  collection.countDocuments(filter),

  collection.countDocuments({
    ...filter,
    success: true,
  }),

  collection.countDocuments({
    ...filter,
    success: false,
  }),

  collection
    .aggregate([
      {
        $match: filter,
      },
      {
        $group: {
          _id: "$pincode",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
      {
        $limit: 10,
      },
    ])
    .toArray(),

  collection
    .aggregate([
      {
        $match: filter,
      },
      {
        $match: {
          city: {
            $ne: null,
          },
        },
      },
      {
        $group: {
          _id: "$city",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
      {
        $limit: 10,
      },
    ])
    .toArray(),
]);

const successRate =
  totalChecks > 0
    ? Number(((successfulChecks / totalChecks) * 100).toFixed(2))
    : 0;

return Response.json({
  success: true,

  filters: {
    from: from || null,
    to: to || null,
  },

  summary: {
    totalChecks,
    successfulChecks,
    failedChecks,
    successRate,
  },

  topPincodes: topPincodes.map((item) => ({
    pincode: item._id,
    count: item.count,
  })),

  topCities: topCities.map((item) => ({
    city: item._id,
    count: item.count,
  })),
});


} catch (error) {
console.error("Analytics summary API error:", error);

return Response.json(
  {
    success: false,
    message: "Unable to fetch analytics summary.",
  },
  {
    status: 500,
  },
);


}
}
