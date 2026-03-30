# builder image
FROM node:20-slim as builder

ENV npm_config_re2_use_precompiled_binaries=1

RUN apt-get update && apt-get install -y \
  python3 \
  make \
  g++ \
  curl \
  libzmq3-dev \
  && rm -rf /var/lib/apt/lists/*

ADD . /var/app

WORKDIR /var/app

RUN npm install && npm run build && npm prune --production

# run image
FROM node:20-slim

COPY --from=builder /var/app /var/app
COPY --from=builder /var/app/kuzzlerc $HOME/.kuzzlerc