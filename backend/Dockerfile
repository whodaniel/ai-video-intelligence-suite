ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-alpine

ENV CI=true
ENV NODE_ENV=production
ENV PORT=8080

RUN apk add --no-cache python3 make g++
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

WORKDIR /app

COPY package.json ./
COPY pnpm-lock.yaml* package-lock.json* ./

RUN if [ -f pnpm-lock.yaml ]; then pnpm install --prod --no-frozen-lockfile --ignore-scripts; else npm install --production --no-optional; fi

COPY . .

EXPOSE 8080

CMD ["node", "server.js"]
