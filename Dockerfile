# grammys-auth-service/Dockerfile (Producción)

# Etapa 1: Compilación
FROM node:24-bookworm AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run lint

RUN npm run build

# Etapa 2: Imagen final limpia para producción
FROM node:24-bookworm-slim

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["npm", "run", "start:prod"]