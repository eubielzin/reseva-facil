# Etapa 1: Dependências e build
FROM node:22-alpine AS builder

# Diretório de trabalho
WORKDIR /app

# Copiar apenas os arquivos necessários para instalar dependências
COPY package.json package-lock.json ./

# Instalar dependências
RUN npm ci

# Copiar o restante da aplicação
COPY . .

# Gerar build de produção
RUN npm run build

# Etapa 2: Imagem final
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copiar apenas o necessário da etapa de build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

# Porta padrão do Next.js
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "start"]
