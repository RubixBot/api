FROM node:17-alpine

COPY . /usr/src
WORKDIR /usr/src

RUN npm i

EXPOSE 8080:8080

CMD ["node", "index.js"]