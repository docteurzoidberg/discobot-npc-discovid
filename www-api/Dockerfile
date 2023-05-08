FROM node:18-alpine3.16

# Packages
RUN apk add dumb-init

# ENV
ENV NODE_ENV production
ENV LANG C.UTF-8
ENV EDITOR nano

# Data volume
RUN mkdir /data 
RUN chown node:node /data

# App directory
WORKDIR /app

# First dependencies. for cache
COPY package*.json ./

RUN npm install --omit-dev

# Then app source
COPY --chown=node:node . .

# Run as node user
USER node

EXPOSE 5000

CMD ["dumb-init", "node", "index"]
