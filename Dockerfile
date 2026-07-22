FROM node:20-alpine

WORKDIR /app

# Copy root configurations
COPY package.json package-lock.json* ./

# Setup Client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Setup Server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# Remove any local .env files so they don't override docker-compose environment variables
RUN rm -f .env && rm -f ../.env || true

# Environment variables for Docker
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Apply migrations without overwriting production data, then start the server.
CMD ["sh", "-c", "npm run db:migrate && npm start"]
