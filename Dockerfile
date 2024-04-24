FROM --platform=$BUILDPLATFORM node:lts-alpine AS base
WORKDIR /app
COPY package.json /
EXPOSE 3000

FROM base AS production
ENV NODE_ENV=production
RUN npm install --production
COPY . /app
CMD npm start

FROM base AS development
ENV NODE_ENV=development
RUN npm i -g nodemon && npm install
COPY . /app
CMD npm run dev