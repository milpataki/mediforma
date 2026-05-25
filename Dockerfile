# ─────────────────────────────────────────────
# Stage 1: base — shared Node.js 24 LTS image
# ─────────────────────────────────────────────
FROM node:24-alpine AS base
WORKDIR /app
COPY package*.json ./

# ─────────────────────────────────────────────
# Stage 2: dev — hot-reload with ts-node-dev
# ─────────────────────────────────────────────
FROM base AS dev
ENV NODE_ENV=development
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ─────────────────────────────────────────────
# Stage 3: build — compile TypeScript
# ─────────────────────────────────────────────
FROM base AS build
ENV NODE_ENV=production
RUN npm ci --omit=dev
COPY . .
RUN npm run build

# ─────────────────────────────────────────────
# Stage 4: prod — lean production image
# ─────────────────────────────────────────────
FROM node:24-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./

# Run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000
CMD ["node", "dist/index.js"]
