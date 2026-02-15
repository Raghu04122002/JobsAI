FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

RUN npm run build

ENV PORT=3000
EXPOSE 3000

CMD ["npx", "next", "start", "-p", "3000"]
