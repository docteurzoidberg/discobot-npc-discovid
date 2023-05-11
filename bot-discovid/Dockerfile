FROM node:18-alpine3.16 as runner

ENV LANG C.UTF-8
ENV EDITOR nano
ENV DATA_PATH /data

RUN apk add dumb-init
RUN mkdir /data

# APP dir
WORKDIR /app

# NODE_MODULES
COPY package*.json ./
RUN npm ci --omit-dev

# APP
COPY . .

# REQUIS: les variables d'environnement DISCORD_GUILD_ID, DISCORD_CLIENT_ID et BOT_TOKEN au build fournis en ARGS!

FROM runner as register

ARG DISCORD_GUILD_ID
ARG DISCORD_CLIENT_ID
ARG BOT_TOKEN
ARG BOT_VERSION

ENV DISCORD_GUILD_ID $DISCORD_GUILD_ID
ENV DISCORD_CLIENT_ID $DISCORD_CLIENT_ID
ENV BOT_TOKEN $BOT_TOKEN
ENV BOT_VERSION $BOT_VERSION

# REGISTER bot commands
RUN npm run register

FROM register as bot

# RUN
CMD ["dumb-init", "npm", "run", "start"]

