import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
await authenticate.admin(request);

const url = new URL(request.url);

const apiUrl = new URL("/api/analytics/summary", url.origin);

const response = await fetch(apiUrl);

if (!response.ok) {
throw new Response("Failed to load analytics", {
status: 500,
});
}

const analytics = await response.json();

return analytics;
}

export default function Analytics() {
const data = useLoaderData<typeof loader>();

const summary = data.summary;

return ( <s-page heading="Pincode Analytics"> <s-section heading="Overview"> <s-grid
       gridTemplateColumns="repeat(4, 1fr)"
       gap="base"
     > <s-box> <s-text>Total Checks</s-text> <s-heading>{summary.totalChecks}</s-heading> </s-box>

```
      <s-box>
        <s-text>Successful Checks</s-text>
        <s-heading>{summary.successfulChecks}</s-heading>
      </s-box>

      <s-box>
        <s-text>Failed Checks</s-text>
        <s-heading>{summary.failedChecks}</s-heading>
      </s-box>

      <s-box>
        <s-text>Success Rate</s-text>
        <s-heading>{summary.successRate}%</s-heading>
      </s-box>
    </s-grid>
  </s-section>

  <s-section heading="Top Searched Pincodes">
    {data.topPincodes.length === 0 ? (
      <s-text>No pincode data available.</s-text>
    ) : (
      data.topPincodes.map(
        (item: { pincode: string; count: number }) => (
          <s-paragraph key={item.pincode}>
            <strong>{item.pincode}</strong> — {item.count} searches
          </s-paragraph>
        ),
      )
    )}
  </s-section>

  <s-section heading="Top Searched Cities">
    {data.topCities.length === 0 ? (
      <s-text>No city data available.</s-text>
    ) : (
      data.topCities.map(
        (item: { city: string; count: number }) => (
          <s-paragraph key={item.city}>
            <strong>{item.city}</strong> — {item.count} searches
          </s-paragraph>
        ),
      )
    )}
  </s-section>
</s-page>


);
}
