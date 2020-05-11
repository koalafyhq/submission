FROM alpine:latest
     
WORKDIR /app

COPY package*.json ./

RUN apk --no-cache add nodejs npm curl
RUN npm install

COPY . .

EXPOSE 8080

CMD ["node", "index.js"]
