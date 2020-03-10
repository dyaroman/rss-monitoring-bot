FROM node:10.15.3-alpine
WORKDIR /usr/src/app
ENV TZ Europe/Kiev
COPY package* ./
RUN npm i
COPY src/ ./src/
CMD npm start
