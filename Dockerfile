FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port: WEB, DevTools, METRO, DevServer
EXPOSE 8081
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002

# Run the development server
#CMD ["npx", "expo", "start", "--tunnel", "--clear"]
CMD ["npm", "run", "web"]
