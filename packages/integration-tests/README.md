### Components library + storybook v2

`docker build -t tests-components-storybook-v2 -f packages/integration-tests/projects/components-storybook-v2/Dockerfile .`

`docker run -it -v $PWD:/tests/packages/integration-tests/projects/components-storybook-v2 -e CYPRESS_baseUrl='https://suite.corp.sldev.cz/components-storybook-v2/develop' tests-components-storybook-v2`
