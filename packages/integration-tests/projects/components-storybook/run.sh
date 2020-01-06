docker run \
-it \
-v $PWD:/tests/packages/integration-tests/projects/components-storybook \
-e CYPRESS_baseUrl='http://suite.corp.sldev.cz/components-storybook/develop' \
tests-components-storybook:latest