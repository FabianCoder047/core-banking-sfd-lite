# syntax=docker/dockerfile:1

FROM node:24-alpine AS build
WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build -- --configuration production

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80
