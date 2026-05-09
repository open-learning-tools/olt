FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY package*.json ./
RUN npm ci --omit=dev

COPY server.js ./server.js
COPY public ./public
COPY content ./content

EXPOSE 8080

CMD ["npm", "start"]
