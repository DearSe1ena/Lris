# 分享给别人时的一条命令部署方案：docker build -t lucia-companion . && docker run -p 3000:3000 -e DEEPSEEK_API_KEY=sk-xxx lucia-companion
FROM node:20-alpine

WORKDIR /app

RUN corepack enable

COPY package.json ./
RUN pnpm install

COPY . .
RUN pnpm build

ENV PORT=3000
EXPOSE 3000

CMD ["pnpm", "start"]
