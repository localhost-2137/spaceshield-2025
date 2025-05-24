FROM node:18-slim

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm
RUN pnpm i

COPY . .
RUN pnpm build

CMD ["node", "index.js"]
