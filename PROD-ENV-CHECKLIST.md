# Railway Production Deployment Checklist

This checklist contains all the environment variables that must be manually configured in the Railway dashboard for the `cvstudio-tools` (Frontend) and `cvstudio-tools-backend` (Backend) services.

## 1. Backend Service (`cvstudio-tools-backend`)

| Variable Name | Description | Source / Notes |
| :--- | :--- | :--- |
| `DATABASE_URL` | Production PostgreSQL connection string. | Provided by Railway Postgres Plugin. |
| `ENVIRONMENT` | Deployment environment. Set to `production`. | Forces `docs_url=None` and `redoc_url=None`. |
| `FRONTEND_URL` | The live URL of your Astro frontend. | e.g., `https://cvstudio.tools`. Used for CORS, Stripe return URLs and as the allowed token origin. |
| `CLERK_ISSUER` | **Required.** Frontend API URL of the Clerk production instance. | Clerk Dashboard -> API Keys -> "Frontend API URL", e.g. `https://clerk.cvstudio.tools`. The backend does not start without it. |
| `CLERK_WEBHOOK_SECRET` | Signing secret of the Clerk webhook endpoint. | Clerk Dashboard -> Webhooks -> Add Endpoint (targeting `/api/v1/webhooks/clerk`, events `user.created`, `user.updated`, `user.deleted`). Starts with `whsec_`. |
| `STRIPE_API_KEY` | Stripe Live Secret Key. | Stripe Dashboard -> API Keys. Starts with `sk_live_`. |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Signing Secret. | Stripe Dashboard -> Webhooks -> Add Endpoint (targeting `/api/v1/webhooks/stripe`, events `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`). Starts with `whsec_`. |
| `STRIPE_PRICE_7D` | Stripe Price ID for the **Sprint Pass**. | Stripe Dashboard -> Products. Starts with `price_`. |
| `STRIPE_PRICE_30D` | Stripe Price ID for the **Active Hunt**. | Stripe Dashboard -> Products. Starts with `price_`. |
| `STRIPE_PRICE_LIFETIME` | Stripe Price ID for the **Lifetime Access**. | Stripe Dashboard -> Products. Starts with `price_`. |
| `OPENAI_API_KEY` | Your active OpenAI API Key. | OpenAI Platform Dashboard. |
| `OPENAI_MODEL` | Optional. Model used by all AI features. | Defaults to `gpt-4o-mini`. |
| `AI_RATE_LIMIT_PER_HOUR` / `AI_RATE_LIMIT_PER_DAY` | Optional. AI calls allowed per user. | Default `20` / `100`. `0` disables a limit. |

No longer used: `CLERK_API_KEY`, `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`.

The container applies database migrations on start (`alembic upgrade head`) and listens on `$PORT`.

---

## 2. Frontend Service (`cvstudio-tools`)

| Variable Name | Description | Source / Notes |
| :--- | :--- | :--- |
| `PUBLIC_API_URL` | The live URL of your backend + `/api/v1`. | e.g., `https://api.cvstudio.tools/api/v1` |
| `PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Publishable Key for production. | Clerk Dashboard -> API Keys (Live Mode). Starts with `pk_live_`. |
| `CLERK_SECRET_KEY` | Clerk Secret Key for production. | Clerk Dashboard -> API Keys. Required for server-side auth checks. |
| `PUBLIC_SALES_EMAIL` | Address the recruiter Enterprise plan's "Contact us" button writes to. | Optional; without it the button is not shown. Public: it ends up in the page. |

---

## 3. Deployment Order

1. Set the new backend variables (`CLERK_ISSUER`, `CLERK_WEBHOOK_SECRET`) **before** deploying the backend.
2. Deploy the backend. Its API additions are backwards compatible with the previous frontend.
3. Deploy the frontend.

---

## 4. Post-Deployment Verification
- [ ] Visit `FRONTEND_URL` and ensure the landing page loads.
- [ ] Check `/health` on the backend (no `/api/v1` prefix) to confirm "healthy" status.
- [ ] Attempt a login to verify Clerk Production keys, then open the dashboard (confirms the backend accepts the session token).
- [ ] Send a test event from the Clerk and Stripe webhook dashboards and confirm a `200` response.
- [ ] Click an AI feature as a non-pro user to verify the "Upgrade" modal triggers.
- [ ] Click a Pricing button to verify Stripe Checkout session generation with Live Price IDs.
- [ ] Download a CV as PDF and confirm the text in the file can be selected.
