# syntax=docker/dockerfile:1

# -- Stage 1: Build --
FROM oven/bun:alpine AS builder
WORKDIR /app

# VitePress requires git for 'lastUpdated' timestamps
RUN apk add --no-cache git

# Install dependencies
COPY package.json ./
# COPY bun.lock ./ 
RUN bun install

# Copy source and build documentation
COPY . .
RUN bun run docs:build

# -- Stage 2: Production --
FROM oven/bun:alpine AS runner
WORKDIR /app

# Final stage needs the package.json and built assets
COPY --from=builder /app/package.json .
COPY --from=builder /app/.vitepress/dist ./.vitepress/dist
# Re-install only production dependencies if needed, or just use 'vitepress'
# For VitePress, 'preview' command is easiest. We need the node_modules for it.
COPY --from=builder /app/node_modules ./node_modules

# Expose port 80 for Coolify
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Serve using Bun and VitePress preview
CMD ["bun", "run", "docs:preview", "--", "--host", "0.0.0.0", "--port", "80"]
