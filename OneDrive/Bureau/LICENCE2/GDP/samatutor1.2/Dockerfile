FROM node:18-alpine

WORKDIR /app

# Copier package*.json et installer les dépendances du serveur
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --only=production

# Copier le reste du projet
WORKDIR /app
COPY . .

# Exposer le port du serveur
EXPOSE 3000

# Démarrer le serveur
CMD ["npm", "start", "--", "--prefix", "server"]
