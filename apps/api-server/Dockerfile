# Stage 1: Builder
FROM node:20-alpine AS builder

# Install build dependencies for native node-gyp builds if needed
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@9.0.0

WORKDIR /app

# Copy lockfiles and workspace configs from repository root
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy api-server package config
COPY apps/api-server/package.json ./apps/api-server/

# Install dependencies using pnpm across the isolated api-server workspace target graph
RUN pnpm install --filter @apps/api-server --frozen-lockfile

# Copy application source layers
COPY apps/api-server ./apps/api-server

# Generate Prisma Client to freeze type-safe binaries
WORKDIR /app/apps/api-server
RUN npx prisma generate


# Stage 2: Runner
FROM node:20-alpine AS runner

WORKDIR /app

# Establish production environment
ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

# Create a non-privileged system user profile (expressapp) to run application securely
RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S expressapp -G nodejs

# Copy essential runtime node_modules and configurations preserving the pnpm layout
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api-server/package.json ./apps/api-server/
COPY --from=builder /app/apps/api-server/node_modules ./apps/api-server/node_modules
COPY --from=builder /app/apps/api-server/src ./apps/api-server/src
COPY --from=builder /app/apps/api-server/prisma ./apps/api-server/prisma
COPY --from=builder /app/apps/api-server/server.js ./apps/api-server/server.js
COPY --from=builder /app/apps/api-server/config ./apps/api-server/config
COPY --from=builder /app/apps/api-server/routes ./apps/api-server/routes

# Grant non-privileged user access to application directory
RUN chown -R expressapp:nodejs /app

# Switch to the non-privileged runtime user context
USER expressapp

# Define the entry point running node server.js from the api-server directory
WORKDIR /app/apps/api-server
CMD ["node", "server.js"]
