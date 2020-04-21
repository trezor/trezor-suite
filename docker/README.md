Disclaimer: docker stuff is fairly new and there are couple of todos left. Also I have no idea
if it works on Mac. Chances are it does not, yet.

# Docker

In `/docker` folder, you might find few handy docker-compose recipes. But first check if you have docker installed.

`docker --version`

`docker-compose --version`


## Suite dev

Suite-dev helps you run local suite development server. So, in theory, you don't need to have node.js or yarn installed on your machine.
This container shares suite folder with your machine, so if you don't have dependencies installed yet, you shall run this first:

`./docker/docker-suite-install.sh`

`./docker/docker-suite-dev.sh`

This will open dev server on http://localhost:3000 and as a bonus a control panel that will allow you to start/stop trezor bridge and work
with emulators!

## Suite test

Suite test opens cypress test runner and prepares everything to run tests.

`./docker/docker-suite-test`


# Maintenance

Temporarily published on docker-hub under mroz22 account.

To build:
`cd ./docker`

`docker build -f ./trezor-user-env/Dockerfile . --tag mroz22/trezor-user-env`

`docker push mroz22/trezor-user-env:latest`