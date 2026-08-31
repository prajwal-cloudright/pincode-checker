import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  const pincode = url.searchParams.get("pincode")?.trim();

  /*
   * Validate pincode
   */
  if (!pincode || !/^\d{6}$/.test(pincode)) {
    return data(
      {
        success: false,
        message: "Please enter a valid 6-digit pincode.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    /*
     * Call India Post API from the backend.
     *
     * The Shopify frontend does NOT call India Post directly.
     */
    const indiaPostUrl =
      "https://api.postalpincode.in/pincode/" +
      encodeURIComponent(pincode);

    const response = await fetch(indiaPostUrl);

    /*
     * Check India Post HTTP response
     */
    if (!response.ok) {
      console.error(
        "India Post API HTTP error:",
        response.status,
        response.statusText,
      );

      return data(
        {
          success: false,
          message: "Unable to check pincode at the moment.",
        },
        {
          status: 502,
        },
      );
    }

    /*
     * Read India Post response
     */
    const apiData = await response.json();

    console.log("India Post API response:", apiData);

    /*
     * Validate India Post response
     */
    if (
      !Array.isArray(apiData) ||
      apiData.length === 0 ||
      apiData[0]?.Status !== "Success" ||
      !Array.isArray(apiData[0]?.PostOffice) ||
      apiData[0].PostOffice.length === 0
    ) {
      return data(
        {
          success: false,
          message: "Delivery unavailable for this pincode.",
          pincode,
        },
        {
          status: 404,
        },
      );
    }

    /*
     * Get first post office
     */
    const postOffice = apiData[0].PostOffice[0];

    /*
     * Return only the information required by
     * the Shopify extension.
     */
    return data({
      success: true,
      message: "Delivery is Available",
      data: {
        pincode: postOffice.Pincode || pincode,
        postOffice: postOffice.Name || "N/A",
        district: postOffice.District || "N/A",
        state: postOffice.State || "N/A",
        deliveryStatus: postOffice.DeliveryStatus || "N/A",
      },
    });
  } catch (error) {
    console.error("Pincode API error:", error);

    return data(
      {
        success: false,
        message: "Unable to check delivery. Please try again.",
      },
      {
        status: 500,
      },
    );
  }
}