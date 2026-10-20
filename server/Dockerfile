FROM node:24-alpine AS base
WORKDIR /app

# Todas as dependências (inclui as de desenvolvimento, para compilar)
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Compila o TypeScript
FROM deps AS build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Só dependências de produção
FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Imagem final, enxuta e sem root
FROM base AS runtime
ENV NODE_ENV=production
COPY package.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]