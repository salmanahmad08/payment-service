# Payment Service API

A NestJS-based payment service API for handling subscriptions, transactions, and webhooks via Stripe. Includes user authentication, payment processing, and transaction management.

## Architecture

- **Backend**: NestJS (Node.js) with TypeScript.
- **Database**: MongoDB (via Mongoose) for users, transactions, and subscriptions.
- **Payments**: Stripe for subscriptions and webhooks.
- **Auth**: JWT-based authentication.
- **Modules**:
  - `auth`: User login with JWT.
  - `users`: User management.
  - `payments`: Payment intents.
  - `transactions`: Transaction listing and management.
  - `subscriptions`: Subscription creation via Stripe.
  - `webhooks`: Stripe webhook handling.

## Setup

1. **Prerequisites**:
   - Node.js 18+
   - Docker & Docker Compose
   - Stripe account (for API keys)

2. **Clone & Install**:
   ```bash
   git clone <repo-url>
   cd payment-service
   npm install
   npm run seed
   npm run start:dev
   ```
