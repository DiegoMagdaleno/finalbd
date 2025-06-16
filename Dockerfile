# ---- Base Image ----
# Usamos una imagen oficial de Node.js. 'alpine' es una versión ligera.
FROM node:18-alpine

# ---- Environment Variables ----
# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# ---- Dependencies ----
# Copiamos package.json y package-lock.json para instalar dependencias
# Se copian por separado para aprovechar el caché de Docker si no cambian
COPY package*.json ./
RUN npm install

# ---- Source Code ----
# Copiamos el resto del código fuente del backend
COPY . .

# ---- Expose Port ----
# Exponemos el puerto en el que corre la API (ej. 3000)
EXPOSE 3000

# ---- Start Command ----
# El comando para iniciar la aplicación cuando el contenedor se inicie
CMD [ "node", "index.js" ]
