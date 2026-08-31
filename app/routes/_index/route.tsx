import type { LoaderFunctionArgs } from "react-router";
import { redirect, Form, useLoaderData } from "react-router";

import { login } from "../../shopify.server";

import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData<typeof loader>();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>
          Pincode Checker - AUTO DEPLOY TEST
        </h1>

        <p className={styles.text}>
          This UI was automatically deployed through GitHub Actions.
        </p>

        {showForm && (
          <Form className={styles.form} method="post" action="/auth/login">
            <label className={styles.label}>
              <span>Shop domain</span>

              <input
                className={styles.input}
                type="text"
                name="shop"
              />

              <span>e.g: my-shop-domain.myshopify.com</span>
            </label>

            <button className={styles.button} type="submit">
              Log in
            </button>
          </Form>
        )}

        <ul className={styles.list}>
          <li>
            <strong>Automatic Deployment</strong>. Changes are automatically
            built and deployed after pushing code to GitHub.
          </li>

          <li>
            <strong>Docker Deployment</strong>. The application is packaged
            into a Docker image and deployed to AWS.
          </li>

          <li>
            <strong>GitHub Actions</strong>. GitHub Actions handles the
            deployment process automatically.
          </li>
        </ul>
      </div>
    </div>
  );
}