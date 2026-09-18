# --- Etapa 1: Build (Construcción) ---
# Usa una imagen de Node.js para construir la aplicación de React
FROM node:18-alpine AS build

# Establece el directorio de trabajo
WORKDIR /app

# Copia package.json y package-lock.json para instalar dependencias
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto del código fuente de la aplicación
COPY . .

# Construye la aplicación para producción
RUN npm run build

# --- Etapa 2: Production (Producción) ---
# Usa una imagen de Nginx ligera para servir la aplicación
FROM nginx:stable-alpine

# Copia los archivos construidos de la etapa anterior
COPY --from=build /app/build /usr/share/nginx/html

# Copia el archivo de configuración personalizado de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expone el puerto 80 (el puerto por defecto de Nginx)
EXPOSE 80

# El comando por defecto de la imagen de Nginx ya se encarga de iniciar el servidor
CMD ["nginx", "-g", "daemon off;"]