FROM node:13-stretch

# setup
RUN apt-get update
RUN apt-get install -y build-essential
RUN apt-get install xvfb libgtk2.0-0 libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 --assume-yes

WORKDIR /tests

# copy root
COPY package.json package.json
COPY lerna.json lerna.json
COPY yarn.lock yarn.lock

# copy package integration tests
COPY packages/integration-tests/package.json packages/integration-tests/package.json

# copy specific project in integration tests package
COPY packages/integration-tests/projects/components-storybook-v2 packages/integration-tests/projects/components-storybook-v2

# install
RUN yarn

# run
CMD [ "yarn", "workspace", "@trezor/integration-tests", "test-components-storybook-v2" ]