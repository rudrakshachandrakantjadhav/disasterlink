# DisasterLink

DisasterLink is a Next.js frontend with an Express, Prisma, and PostgreSQL backend.

## Get started with Neon

The backend is already configured for PostgreSQL through Prisma, so Neon only needs to provide the database connection string.

1. Create a Neon project at https://console.neon.tech.
2. In the Neon dashboard, click **Connect**, select your branch, database, and role, then copy the connection string.
3. Put the connection string in `server/.env` as `DATABASE_URL`. Keep `sslmode=require` in the URL.

```env
DATABASE_URL="postgresql://<role>:<password>@<endpoint>.<region>.aws.neon.tech/<database>?sslmode=require"
```

For this Express API, a direct Neon connection string is fine for local development and Prisma commands. If you deploy into a serverless or high-concurrency environment, copy Neon's pooled connection string instead; it has `-pooler` in the hostname.

Then initialize the schema and demo data:

```bash
cd server
npm install
npm run prisma:generate
npm run prisma:push
npm run seed
```

Run the API and frontend in separate terminals:

```bash
cd server
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

The frontend expects `NEXT_PUBLIC_API_URL=http://localhost:5000/api` and the backend sample env allows requests from `http://localhost:3000`.
