# syntax=docker/dockerfile:1

# ---- Build stage: install all deps and build both workspaces ----
FROM node:24-slim AS builder
WORKDIR /app

# Build toolchain for native modules (better-sqlite3) in case a prebuilt
# binary is unavailable for this platform.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies first to leverage Docker layer caching.
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci

# Build the frontend (Vite) and backend (Nest).
COPY . .
RUN npm run build

# ---- Runtime stage: minimal image that runs the API + serves the SPA ----
FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_PATH=/app/data/app.sqlite \
    FRONTEND_DIST=/app/frontend/dist

# Reuse the dependency tree (incl. the compiled better-sqlite3 binary) built
# against the identical base image above.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/frontend/dist ./frontend/dist

RUN mkdir -p /app/data
EXPOSE 3000

# Basic container healthcheck against the liveness endpoint.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "backend/dist/main.js"]
