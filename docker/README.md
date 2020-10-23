# Docker dev environment

The idea is to run development tools somewhat isolated inside docker containers.

A developer should be able:

1. to spin up whole environment with a single script without complex dependencies, see prerequisites below
1. to open the trezor-suite web app from his host machine
1. to see emulator and test the bridge via dev control panel
1. to run tests inside containers

If you are interested in more details about this solution, see [docs/notes.md](docs/notes.md).

## Prerequisites:

Please make sure you have the latest versions of these tools:
```
docker --version
docker-compose --version
mutagen version
```

In case of [mutagen](https://mutagen.io/documentation/orchestration/compose) we currently require the latest beta 
version with docker-compose support.

## Level 1 - basic development

To spin up live development server, emulator and debug control panel, to quit hit CTRL+C:
```
./docker-suite-dev.sh
```

Please give it some time. First time it will download and build everything. Subsequent runs should be faster.

If all goes well, at the end you should see something like:
```
trezor_suite_dev | ready - started server on http://localhost:3000
```

On your local machine you should be now able to access the web app:
* suite web app => [http://localhost:3000](http://localhost:3000)
* control panel => [http://localhost:3001](http://localhost:3001)

Do you see the [landing page](http://localhost:3000)? Good!

#### Edit source code

This app was built from your current sources, and we use [Mutagen](https://mutagen.io) to sync your changes inside container.
While you are looking at the page in your browser, you can try to edit `packages/suite/src/views/suite/device-connect/index.tsx`
for example add `background-color: orange;` into `Title = styled.div` section.
When you hit save, you should see some activity in terminal logs of `./docker-suite-dev.sh`.
Now, finally the page should live-reload and reflect orange background under the title.

#### Use emulator

New let's try to use emulator to 

Go to the [control panel](http://localhost:3001) and then:
1. click "Start" under "Bridge commands" 
1. click to "Start X.Y.Z" under "Emulator start".
  
This should open the emulator in a window using Xserver.

To see the emulator you have to properly setup Xserver on your host machine. Docker containers tries to open Xwindows on 
your host machine. Running Xserver is more complex topic depending on OS, but you might have easy win running:

```
./prepare-xserver.sh
```

Please note that `./docker-suite-dev.sh` is meant to be a long-running process, and it should last during your whole 
dev session. When you hit CTRL+C, it stops all containers and removes them. It also stops mutagen session.

## Level 2 - running tests

You can run test inside trezor_test_runner container. Note that `./docker-suite-dev.sh` must be fully running 
for cypress tests.

```
# to run visual cypress tests (requires Xserver)
./docker/docker-suite-test-cypress.sh 

# to run unit tests
./docker/docker-suite-test-unit.sh
```

## Level 3 - taking more control

See [_config.sh](_config.sh) for configurability options.

While `./docker-suite-dev.sh` is running, you can enter shells inside containers:

```
./docker-suite-dev-shell.sh
./docker-suite-test-shell.sh
./docker-suite-env-shell.sh
```

## FAQ

> How to run docker-compose commands?

Try `./dc` alias.

> How to check status of the environment?

Try `./dc ps`.

> How to display the current effective config?

Run `./docker-suite-config.sh`

> Something is messed up, how to start from scratch?

1. Stop `./docker-suite-dev.sh`.
1. Run `./docker-suite-clean.sh`.
1. Start `./docker-suite-dev.sh` again.
