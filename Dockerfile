FROM node:18 AS compile-env
ADD . /app
WORKDIR /app
RUN npm install
RUN npm run compile

FROM node:18 AS install-env
ADD . /app
WORKDIR /app
RUN npm install --omit=dev --ignore-scripts

FROM gcr.io/distroless/nodejs18-debian11
COPY --from=compile-env /app/build /app/build
COPY --from=install-env /app/node_modules /app/node_modules
WORKDIR /app
CMD ["build/src/index.js"]
