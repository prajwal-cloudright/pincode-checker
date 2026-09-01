import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";

import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const errors = loginErrorMessage(await login(request));

  return {
    errors,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  console.log("LOGIN REQUEST:", request.method, request.url);

  const formData = await request.clone().formData();

  console.log(
    "LOGIN SHOP:",
    formData.get("shop")
  );

  const errors = loginErrorMessage(await login(request));

  return {
    errors,
  };
};

export default function Auth() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const [shop, setShop] = useState("");

  const { errors } = actionData || loaderData;

  return (
    <AppProvider embedded={false}>
      <s-page>

        <Form method="post" action="/auth/login">

          <s-section heading="Log in">

            <div style={{ marginBottom: "16px" }}>

              <label
                htmlFor="shop"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: 600,
                }}
              >
                Shop domain
              </label>

              <input
                id="shop"
                name="shop"
                type="text"
                value={shop}
                onChange={(event) => {
                  setShop(event.target.value);
                }}
                placeholder="pincode-checker-xjsg1dyb.myshopify.com"
                autoComplete="on"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px",
                  border: "1px solid #8c9196",
                  borderRadius: "6px",
                  fontSize: "16px",
                }}
              />

              {errors?.shop && (
                <div
                  style={{
                    marginTop: "6px",
                    color: "#d72c0d",
                    fontSize: "14px",
                  }}
                >
                  {errors.shop}
                </div>
              )}

            </div>

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "12px 20px",
                border: "none",
                borderRadius: "6px",
                background: "#008060",
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Log in
            </button>

          </s-section>

        </Form>

      </s-page>
    </AppProvider>
  );
}