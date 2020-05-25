FROM node:10.15.3-alpine
WORKDIR /usr/src/app
ENV TZ Europe/Kiev
COPY package* ./
RUN npm i --production
COPY app.js ./src/ ./src/
CMD npm start
