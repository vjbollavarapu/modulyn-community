## 📝 Cursor.AI Prompt for Landing Page (UI + Content)

Here’s a **one-credit-efficient master prompt** you can drop into Cursor.AI to generate the **landing page**:

---

> **Task:** Build a responsive landing page for **Modulyn** with React + TailwindCSS (or Material-UI if needed).
>
> **Project Context:** Modulyn is an ERP system with two versions:
> – **Community Edition (Free, Open Source, Single Tenant)** → self-host, Web3 grant-friendly.
> – **Commercial Edition (Paid, Multi-Tenant SaaS)** → partner/reseller ready, advanced AI & integrations.
> Revenue model: subscription (SaaS), hosting, support, training.
>
> **Landing Page Requirements:**
>
> 1. **Hero Section** → headline, sub-headline, CTA buttons (*Download Community, Try Demo Enterprise*).
> 2. **About Section** → short description, why cleaning ERP, trust + innovation.
> 3. **Versions Section** → side-by-side comparison of Community vs Enterprise features.
> 4. **Pricing Table** →
>    – Community: Free (download + self-host).
>    – Hosting: \$30–\$99/mo.
>    – Pro SaaS: \$299/mo.
>    – Enterprise: Custom pricing.
> 5. **Services Section** → Hosting, Support, Training (cards with details + CTA).
> 6. **Partners/Resellers Section** → info on dealer/reseller white-label program.
> 7. **Footer** → GitHub link, documentation, support.
>
> **Design Notes:**
> – Clean, enterprise feel (light theme, blue/teal accents).
> – Responsive grid layout (desktop + mobile).
> – Use reusable components (Hero, PricingCard, FeatureList).
> – Keep modular for future integration into main site.

## 💳 Cursor.AI Prompt – Pricing & Subscription Flow

> **Task:** Build a **pricing & subscription flow** for Modulyn using **React + TypeScript + Material-UI (or TailwindCSS)** with backend integration hooks for **Stripe and PayPal**.
>
> **Project Context:** Modulyn has two editions:
> – **Community Edition (Free, Open Source, Single Tenant)** → download only (no payment).
> – **Commercial SaaS Edition (Multi-Tenant)** → requires subscription.
> Services: hosting, support, training.
>
> **Requirements:**
>
> 1. **Pricing Table Component**
>    – Four columns: Community (Free), Hosting, Pro SaaS, Enterprise.
>    – Each column has: name, price, feature list, CTA button.
>    – Highlight “Most Popular” on Pro SaaS.
>    – Responsive layout (grid collapses to vertical on mobile).
>
> 2. **Subscription Flow**
>    – When clicking **Subscribe**, open modal to choose payment option (Stripe or PayPal).
>    – Integrate **Stripe Checkout** for credit card payments.
>    – Integrate **PayPal Smart Buttons** for PayPal subscriptions.
>    – For Community → CTA should link to GitHub repo instead of payment.
>
> 3. **Authentication Integration**
>    – Only authenticated users can subscribe.
>    – If not logged in → redirect to login/signup.
>
> 4. **API Integration**
>    – Create service layer (`services/payments.ts`) with functions:
>
> * `createStripeCheckoutSession(planId, userId)`
>
> * `createPayPalSubscription(planId, userId)`
>   – Connect to backend endpoints (`/api/payments/stripe`, `/api/payments/paypal`).
>   – On success → redirect user to confirmation page (`/subscription/success`).
>   – On cancel → redirect to `/subscription/cancelled`.
>
> 5. **UX Details**
>    – Show **loading state** during API call.
>    – Show **error state** if payment fails.
>    – Confirmation page should display plan name, subscription ID, next billing date.
>    – Use toast notifications for feedback (success, error, warning).
>
> **Deliverables:**
> – `PricingTable` component with Community, Hosting, Pro, Enterprise tiers.
> – Subscription modal with Stripe + PayPal options.
> – Service layer for API calls.
> – Success and Cancel pages.
> – Responsive + production-ready design.
