# 1단계: 빌드 (TypeScript → JavaScript 변환)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
# PRISMA_GENERATE_SKIP_AUTOINSTALL: Prisma 설치 시 바이너리 자동 다운로드 건너뜀
RUN PRISMA_GENERATE_SKIP_AUTOINSTALL=true npm ci
COPY . .
# 로컬에서 미리 생성한 Linux용 Prisma 바이너리 복사 (SSL 이슈 우회)
COPY node_modules/.prisma ./node_modules/.prisma
RUN npm run build

# 2단계: 실행 (빌드된 결과물만 담아서 가볍게)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN PRISMA_GENERATE_SKIP_AUTOINSTALL=true npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000
CMD ["node", "dist/index.js"]
