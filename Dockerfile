FROM node:10.15.3-alpine
WORKDIR /usr/src/app
ENV TZ Europe/Kiev
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 8443
CMD npm start