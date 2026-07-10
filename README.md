# Huddle

Next.js + Convex + Clerk version of the Huddle corkboard app.

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create Clerk keys and copy `.env.example` to `.env.local`.

3. Configure Convex:

   ```bash
   npx convex dev
   ```

   This generates the real `convex/_generated/*` files and gives you
   `NEXT_PUBLIC_CONVEX_URL`.

4. Add these values to `.env.local`:

   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
   CLERK_SECRET_KEY=
   NEXT_PUBLIC_CONVEX_URL=
   CLERK_JWT_ISSUER_DOMAIN=
   ```

5. Run the app:

   ```bash
   npm run dev
   ```

## Checks

```bash
npx tsc --noEmit
npm run build
```
