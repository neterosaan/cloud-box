# ---- Stage 1: Build ----
# This stage has full devDependencies -- it's discarded after building,
# never shipped, so its size doesn't matter.
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npx prisma generate

# ---- Stage 2: Runtime ----
# This is the image that actually gets deployed -- production deps only.
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Prisma's generated client is split across two locations -- both are
# required, or the app fails at import time with "Cannot find module
# '.prisma/client/index.js'". @prisma/client alone is just a thin wrapper;
# the actual generated code lives in the separate .prisma folder.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma

COPY src ./src
COPY prisma ./prisma

# Run as a non-root user -- if the app were ever compromised, the attacker
# doesn't get root inside the container for free.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]