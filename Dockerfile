FROM node:18 AS build-env
ADD . /app
WORKDIR /app
RUN \
  npm install && \
  npm run compile && \
  rm -rf node_modules && \
  npm install --omit-dev --ignore-scripts

FROM gcr.io/distroless/nodejs18-debian11
COPY --from=build-env /app/build /app/build
COPY --from=build-env /app/node_modules /app/node_modules
WORKDIR /app
CMD ["build/src/index.js"]
