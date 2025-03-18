# 第一阶段：构建依赖
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install

# 第二阶段：生产镜像
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 5000
CMD ["node", "app.js"]