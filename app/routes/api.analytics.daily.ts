import type { LoaderFunctionArgs } from "react-router";
import clientPromise from "../mongodb.server";

export async function loader({ request }: LoaderFunctionArgs) {
try {
const url = new URL(request.url);


const from = url.searchParams.get("from");
const to = url.searchParams.get("to");

const match: Record<string, unknown> = {};

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

  match.timestamp = timestampFilter;
}

const client = await clientPromise;

const db = client.db("pincode_checker");
const collection = db.collection("analytics");

const dailyAnalytics = await collection
  .aggregate([
    {
      $match: match,
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$timestamp",
          },
        },
        totalChecks: {
          $sum: 1,
        },
        successfulChecks: {
          $sum: {
            $cond: [
              "$success",
              1,
              0,
            ],
          },
        },
        failedChecks: {
          $sum: {
            $cond: [
              "$success",
              0,
              1,
            ],
          },
        },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
  ])
  .toArray();

const data = dailyAnalytics.map((item) => ({
  date: item._id,
  totalChecks: item.totalChecks,
  successfulChecks: item.successfulChecks,
  failedChecks: item.failedChecks,
}));

return Response.json({
  success: true,

  filters: {
    from: from || null,
    to: to || null,
  },

  data,
});


} catch (error) {
console.error("Daily analytics API error:", error);


return Response.json(
  {
    success: false,
    message: "Unable to fetch daily analytics.",
  },
  {
    status: 500,
  },
);


}
}
