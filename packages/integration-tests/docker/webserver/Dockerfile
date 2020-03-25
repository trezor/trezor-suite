FROM node:12-buster

# setup
RUN apt-get update

WORKDIR /tests

# copy root
COPY package.json /tests/package.json
COPY lerna.json /tests/lerna.json
COPY yarn.lock /tests/yarn.lock

# copy package.json integration tests
COPY packages/integration-tests/package.json /tests/packages/integration-tests/package.json

# copy specific project in integration tests package
COPY packages/integration-tests/projects/components-storybook /tests/packages/integration-tests/projects/components-storybook

# install
RUN yarn

# run
CMD [ "yarn", "workspace", "@trezor/integration-tests", "test:components-storybook" ]