# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first (cache-friendly layer)
COPY package.json package-lock.json* ./
RUN npm install

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source and build
COPY nest-cli.json tsconfig.json ./
COPY src ./src
RUN npx nest build

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Only production dependencies
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy build artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Regenerate Prisma client in production stage
RUN npx prisma generate

EXPOSE 4000

# Run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
