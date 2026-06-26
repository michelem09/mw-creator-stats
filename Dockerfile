# Standalone (self-hosted) build of the web target. The browser does the scrape and
# stores snapshots in IndexedDB; this server only serves the app and runs the thin
# /api/mw-proxy relay (cf_clearance is IP-bound, so run this where your browser is).
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN yarn install --frozen-lockfile
RUN yarn build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3617
COPY --from=builder /app ./
EXPOSE 3617
CMD ["yarn", "workspace", "@mw/web", "start"]
