### Components library + storybook v2

`docker build -t tests-components-storybook -f packages/integration-tests/projects/components-storybook/Dockerfile .`

`docker run -it -v $PWD:/tests/packages/integration-tests/projects/components-storybook -e CYPRESS_baseUrl='https://suite.corp.sldev.cz/components-storybook/develop' tests-components-storybook`
