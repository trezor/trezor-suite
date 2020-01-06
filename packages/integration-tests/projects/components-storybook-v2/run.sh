docker run \
-it \
-v $PWD:/tests/packages/integration-tests/projects/components-storybook-v2 \
-e CYPRESS_baseUrl='http://suite.corp.sldev.cz/components-storybook-v2/develop' \
tests-components-storybook-v2:latest