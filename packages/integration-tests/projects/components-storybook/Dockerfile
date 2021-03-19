FROM node:14-buster

# setup
RUN apt-get update
RUN apt-get install -y build-essential
RUN apt-get install xvfb libgtk2.0-0 libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 --assume-yes

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