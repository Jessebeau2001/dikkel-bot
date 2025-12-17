FROM node:25-alpine AS build

WORKDIR /app

COPY package*.json .
COPY src/ ./src

RUN npm install
RUN npm run build:slim

FROM node:25-alpine

WORKDIR /app

COPY package*.json .
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

CMD ["node", "dist/app.js"]