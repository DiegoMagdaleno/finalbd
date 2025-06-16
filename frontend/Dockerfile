# ----- STAGE 1: Build -----
# Aquí construimos la aplicación de React
FROM node:18-alpine as builder

WORKDIR /app

# Copiar archivos de dependencias e instalar
COPY package*.json ./
RUN npm install

# Copiar el código fuente
COPY . .

# Construir la aplicación para producción
RUN npm run build


# ----- STAGE 2: Serve -----
# Aquí usamos Nginx para servir los archivos estáticos
FROM nginx:stable-alpine

# Copiamos los archivos estáticos construidos en la etapa anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Borramos la configuración por defecto de Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiamos nuestra configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d

# Exponemos el puerto 80
EXPOSE 80

# Comando para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
