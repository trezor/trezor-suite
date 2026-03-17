FROM node:20-alpine

WORKDIR /app

COPY package.json ./package.json
COPY src ./src

# Minimal runtime dependency for TS execution
RUN npm install -g tsx@4.20.3

ENV PORT=5180
EXPOSE 5180

CMD ["tsx", "src/server.ts"]

