# Desktop e2e on Windows

`template-suite-run-e2e-windows.yml` runs the `@windows` subset of the desktop e2e tests on
GitHub-hosted `windows-latest` runners. The nightly workflow calls it next to the Linux groups,
`test-suite-desktop-e2e-win-nightly.yml` is the manual run for a branch.

## How it runs

- Playwright and the Electron app run on Windows. The app bundle is platform-neutral, so the
  Windows runners use the build the Linux groups use.
- The test environment is the Linux one, `docker/docker-compose.suite-ci-e2e.yml`. The hosted
  Windows runners cannot run Linux containers, so `suite/e2e/scripts/windows/start-test-env.ts`
  starts it in Docker inside WSL2 and the Docker CLI on Windows reaches that daemon over
  `DOCKER_HOST`.
- WSL forwards Windows loopback to the services, so the `127.0.0.1` addresses in the tests and in
  Suite work unchanged. The hosted runners support only NAT networking, not mirrored.

## Tagging

Tag a test `@windows` when it exercises the Electron main process or OS integration.

## Running it yourself

- CI: `gh workflow run test-suite-desktop-e2e-win-nightly.yml --ref <branch>`, which builds the
  app and runs the subset.
- Locally on Windows: download the Ubuntu image the template names, run
  `yarn workspace @trezor/suite-e2e test-env:windows <image> trezor-user-env-unix`, set
  `DOCKER_HOST=tcp://127.0.0.1:2375` and run Playwright with `playwright-desktop-windows.config.ts`
  against the desktop build extracted into `suite-app/desktop-app`. `wsl --terminate trezor-user-env`
  stops the environment, including the session the script leaves behind to keep the distro
  running. The script stops when the `trezor-user-env` WSL distro already exists; `--reset`
  deletes and recreates it. A Windows VM with nested virtualization on a Linux workstation works.
- The test code itself is platform-agnostic: a failure that reproduces on Linux with the Docker
  trezor-user-env is a test bug, one that does not is the Windows finding.

## Known Windows differences

- Electron keeps the single-instance lock as a kernel object, not a file in user data, so a second
  Suite instance is always refused there. Tests must wait for a previous app to exit before
  launching their own.
- The Connect permissions modal names the calling process `Node.js`, not `node`.
