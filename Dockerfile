FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Include devDependencies for development
RUN npm install

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Default command: run depending on NODE_ENV
CMD ["node", "server.js"]
#CMD ["sh", "-c", "if [ \"$NODE_ENV\" = 'production' ]; then node server.js; else npx nodemon server.js; fi"]
