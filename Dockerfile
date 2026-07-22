FROM node:20-alpine

# Install global tools needed
RUN npm install -g typescript tsx concurrently

WORKDIR /app

# Copy root configurations
COPY package.json package-lock.json* ./

# Setup Client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Setup Server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npm run build

# Combine (Copy built client into server's static directory)
RUN mkdir -p dist/public
RUN cp -r ../client/dist/* dist/public/ || true

# Remove any local .env files so they don't override docker-compose environment variables
RUN rm -f .env && rm -f ../.env || true

# Environment variables for Docker
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# The CMD script runs migrations, seeds, and then starts the server.
CMD ["sh", "-c", "npm run db:migrate && npm run db:seed && npm start"]
