FROM oven/bun:alpine
WORKDIR /app

# VitePress needs git for lastUpdated timestamps during build
RUN apk add --no-cache git

# Install dependencies via Bun (use lockfile when available)
COPY package.json ./
RUN bun install

# Copy source and build
COPY . .
RUN bun run docs:build

EXPOSE 80

# Bind VitePress preview server to all interfaces and default HTTP port for Coolify proxy
CMD ["bun", "run", "docs:preview", "--", "--host", "0.0.0.0", "--port", "80"]
