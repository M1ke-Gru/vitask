# ---- Build stage ----
FROM node:20 AS build
WORKDIR /app

# Ensure dev deps are installed (required for vite)
ENV NODE_ENV=development

# Install dependencies (use lockfile if you have it)
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --include=dev

# Copy the rest and build
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM nginx:alpine
# Nginx config that proxies /api to backend
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy Vite output (Vite default -> dist/)
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

