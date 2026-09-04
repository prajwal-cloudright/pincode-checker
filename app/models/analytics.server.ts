import clientPromise from "../mongodb.server";

export interface DeliveryAnalytics {
  pincode: string;
  city: string | null;
  timestamp: Date;
  success: boolean;
  deliveryCompanies: string[];
}

export async function saveDeliveryAnalytics(
  data: DeliveryAnalytics,
) {
  const client = await clientPromise;

  const db = client.db("pincode_checker");

  const collection = db.collection("analytics");

  await collection.insertOne({
    pincode: data.pincode,
    city: data.city,
    timestamp: data.timestamp,
    success: data.success,
    deliveryCompanies: data.deliveryCompanies,
  });
}