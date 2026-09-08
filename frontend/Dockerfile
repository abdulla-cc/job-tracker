# ------------------------------------------------------------------------------
# Frontend Multi-Stage Dockerfile (React/Vite + Nginx)
# ------------------------------------------------------------------------------

# Stage 1: Build static assets
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy frontend source
COPY . .

# Pass API URL build arg (defaults to backend host)
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

# Build optimized production bundle to /app/dist
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Serve with lightweight Nginx (~25MB)
# ------------------------------------------------------------------------------
FROM nginx:alpine

# Remove default nginx HTML files
RUN rm -rf /usr/share/nginx/html/*

# Copy built static files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration with SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

