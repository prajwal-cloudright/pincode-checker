import type { LoaderFunctionArgs } from "react-router";
import clientPromise from "../mongodb.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const client = await clientPromise;

    await client.db("pincode_checker").command({
      ping: 1,
    });

    return Response.json({
      success: true,
      message: "MongoDB connection successful",
    });
  } catch (error) {
    console.error("MongoDB connection error:", error);

    return Response.json(
      {
        success: false,
        message: "MongoDB connection failed",
      },
      { status: 500 },
    );
  }
}