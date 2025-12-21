# ---- Build stage ----
FROM node:20 AS build
WORKDIR /app

# Install deps (dev deps needed for vite build)
COPY package*.json ./
RUN npm ci

# Pass API URL into the build
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Copy the rest and build
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM nginx:alpine
# If you don't need /api proxying here (Caddy handles it), you can use a plain SPA nginx.conf.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
