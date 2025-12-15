# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /build

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including dev for building)
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# -------------------------------------------# ========================================
# Stage 2: Production Runtime
# ========================================
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies
# - dumb-init: proper signal handling
# - curl: health checks
# - openssl1.1-compat: required by Prisma engine
RUN apk add --no-cache dumb-init curl openssl1.1-compat

# Copy package files
COPY --from=builder /build/package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy Prisma schema and generated client
COPY --from=builder /build/prisma ./prisma
COPY --from=builder /build/node_modules/.prisma ./node_modules/.prisma

# Copy built code
COPY --from=builder /build/dist ./dist

# Create log directory
RUN mkdir -p /var/log/app && \
    chown -R node:node /var/log/app

# Use non-root user
USER node

# Environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/health/live || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start server
CMD ["node", "dist/server.js"]
