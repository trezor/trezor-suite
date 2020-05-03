Disclaimer: 
- GUI from docker container does not work on mac. Only linux is supported at the moment.
- Anyone willing to help with mac configuration might start here https://medium.com/@nihon_rafy/building-a-dockerized-gui-by-sharing-the-host-screen-with-docker-container-b660835fb722

# Docker

In `/docker` folder, you might find few handy docker-compose recipes. But first check if you have docker installed.

`docker --version`

`docker-compose --version`


## Suite dev

Suite-dev helps you run local suite development server. So, in theory, you don't need to have node.js or yarn installed on your machine.
This container shares suite folder with your machine, so if you don't have dependencies installed yet, you shall run this first:

`./docker/docker-suite-install.sh`

`./docker/docker-suite-dev.sh`

This will open dev server on http://localhost:3000 and as a bonus a control panel that will allow you to start/stop trezor bridge and work with emulators!

## Suite test

Suite test opens cypress test runner and prepares everything to run tests.

`./docker/docker-suite-test.sh`

### Image snapshots

It is possible to run tests with image snapshots to test for visual regressions. To enable snapshots, use env variable:

`CYPRESS_SNAPSHOT=1 ./docker/docker-suite-test.sh`

# Maintenance

Temporarily published on docker-hub under mroz22 account.

To build:
`cd ./docker`

`docker build -f ./trezor-user-env/Dockerfile . --tag mroz22/trezor-user-env`

`docker push mroz22/trezor-user-env:latest`