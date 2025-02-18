FROM node:14.17.0
#ARG NODE_ENV=production
#ENV NODE_ENV=${NODE_ENV}

EXPOSE 3000

WORKDIR /app

COPY . .

RUN npm install -g @nestjs/cli
COPY . .
RUN npm install
COPY . .
RUN npm run build
COPY . .
CMD ["npm","run","start:prod"]
