### Components library + storybook v2

#### build

`docker build -t tests-components-storybook-v2 -f packages/integration-tests/projects/components-storybook-v2/Dockerfile .`

#### run dev server

`docker run -it -e CYPRESS_baseUrl='[URL]' tests-components-storybook-v2:latest` template
`docker run -it -e CYPRESS_baseUrl='http://suite.corp.sldev.cz/components-storybook-v2/develop' tests-components-storybook-v2:latest` develop branch dev
`docker run -it -e CYPRESS_baseUrl='http://localhost:9001' tests-components-storybook-v2:latest` localhost
