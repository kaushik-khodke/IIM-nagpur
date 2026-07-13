FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --prod

# Copy source code
COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
