FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
COPY tsconfig.base.json ./
COPY .yarn ./.yarn

# Workspace složky dle root package.json#workspaces
COPY packages ./packages
COPY suite-common ./suite-common
COPY suite ./suite
# analytics-docs build-data importuje definice eventů ze suite-native/analytics
COPY suite-native/analytics ./suite-native/analytics
COPY scripts ./scripts

RUN corepack enable && \
    echo -e "\nenableScripts: false" >> .yarnrc.yml && \
    echo -e "\nenableHardenedMode: false" >> .yarnrc.yml && \
    yarn workspaces focus @trezor/analytics-docs && \
    yarn workspace @trezor/analytics-docs build
 
WORKDIR /app/packages/analytics-docs

ENV PORT=5180
EXPOSE 5180

CMD ["yarn", "serve"]

