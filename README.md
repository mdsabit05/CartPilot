# CartPilot — AI Agent for Autonomous Commerce

Razorpay AI Buildathon — **Track 1: AI Growth & Agentic Commerce**.

## Problem
Traditional e-commerce makes customers manually search, compare, decide, build a cart, hunt for offers, and reach checkout. CartPilot turns that flow into a natural-language conversation.

## Solution
CartPilot is an AI commerce agent that can discover products, compare them, maintain contextual cart state, identify growth/offer opportunities, and hand the customer to checkout.

The MVP is deliberately honest: the catalog is local demo data, the deterministic fallback is clearly a demo agent, and Razorpay payment becomes a real **Test Mode** checkout only when server-side test credentials are configured.

## Key demo
1. `I need wireless headphones under ₹5,000 for travel`
2. `Compare the first and third`
3. `Add the second one to my cart`
4. `Apply the best available offer`
5. CartPilot detects the ₹101 gap and recommends **AirTag Travel Case — ₹399**.
6. Click **Add to cart**. The cart crosses ₹5,000 and the 10% growth offer unlocks.
7. `Proceed to checkout`
8. With Razorpay test keys configured, click **Pay** to open Razorpay Test Mode. Without keys, the UI remains a demo checkout.

## Why it is agentic
The agent maps natural-language intent to bounded commerce actions instead of acting as a generic chatbot:

- `search_products`
- `get_product_details`
- `compare_products`
- `add_to_cart`
- `remove_from_cart`
- `get_cart`
- `find_best_offer`
- `apply_offer`
- checkout handoff

The offer engine is the growth component: when the cart is close to the ₹5,000 threshold, it can surface a relevant accessory that helps unlock the configured offer.

## Architecture
```mermaid
flowchart TD
  U[Customer] --> UI[Next.js + React UI]
  UI --> API[/api/chat]
  API --> A[Commerce Agent]
  A --> T[Tool Router / Commerce Logic]
  T --> S[Product Search]
  T --> C[Cart Service]
  T --> O[Offer Engine]
  T --> K[Checkout Service]
  S --> D[(Local Catalog / optional PostgreSQL)]
  C --> D
  O --> D
  K --> RP[Razorpay Test Mode]
```

## Tech stack
- Next.js 15
- React 19
- TypeScript
- Node.js API routes
- Optional OpenAI tool calling
- Optional PostgreSQL + Prisma
- Razorpay Standard Checkout Test Mode

## Run locally
```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment
Copy `.env.example` to `.env`.

- `OPENAI_API_KEY` — optional; enables the LLM tool-calling path.
- `OPENAI_MODEL` — optional model name.
- `DATABASE_URL` — optional PostgreSQL persistence path.
- `RAZORPAY_KEY_ID` — optional Razorpay **Test Mode** key ID.
- `RAZORPAY_KEY_SECRET` — optional Razorpay **Test Mode** secret. Server-only; never expose it to the browser.

## Razorpay Test Mode
CartPilot creates an order server-side through Razorpay's Orders API and passes the returned `order_id` into Standard Checkout. On successful checkout, the server verifies the returned payment signature before marking the test payment as verified.

No live credentials should be used for the buildathon demo.

## Known limitations
- Demo catalog is local and seeded rather than connected to a live merchant catalog.
- Without `OPENAI_API_KEY`, the fallback agent uses deterministic intent handling.
- Cart persistence is currently client/session based in the MVP.
- Payment is Test Mode only when Razorpay credentials are supplied.

## Submission positioning
**One-line pitch:**
> CartPilot turns shopping into an agentic conversation: tell it what you need, and it discovers, compares, optimizes the cart, unlocks relevant offers, and hands off to a bounded checkout.


## Demo checkout fallback

If Razorpay Test Mode credentials are unavailable, CartPilot opens a clearly labeled local **Test Mode Simulation** instead of pretending a payment occurred. The simulation shows the payment-method handoff and a verified-demo receipt. When `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are configured, the app uses Razorpay Checkout and server-side signature verification instead.
