# Estágio 1: Build da aplicação React/Vite
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar manifesto de dependências
COPY package.json package-lock.json ./

# Instalar todas as dependências
RUN npm ci

# Copiar arquivos do projeto
COPY . .

# Compilar produção (gera a pasta dist)
RUN npm run build

# Estágio 2: Ambiente de Produção com Node.js + Express
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copiar manifesto de dependências
COPY package.json package-lock.json ./

# Instalar apenas dependências de produção
RUN npm ci --only=production

# Copiar o build estático e o servidor de produção
COPY --from=builder /app/dist ./dist
COPY server.js ./
COPY tudo.csv ./
COPY dados-6056-2026100509-1363096.csv ./

EXPOSE 3000

CMD ["node", "server.js"]
