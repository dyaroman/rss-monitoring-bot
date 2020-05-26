FROM node:10.15.3-alpine
WORKDIR /usr/src/rss-monitoring-bot
ENV TZ Europe/Kiev
COPY package* ./
RUN npm i --production
COPY ./src/ ./src/
CMD npm start
