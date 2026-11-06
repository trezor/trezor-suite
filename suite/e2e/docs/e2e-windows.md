# Desktop e2e on Windows

`template-suite-run-e2e-windows.yml` runs the `@windows` subset of the desktop e2e tests on
GitHub-hosted `windows-latest` runners. The nightly workflow calls it next to the Linux groups,
`test-suite-desktop-e2e-win-nightly.yml` is the manual run for a branch.

## How it runs

- Playwright and the Electron app run on Windows. The app bundle is the `desktop-app-build-e2e`
  artifact of the calling workflow's build job, built on Linux and platform-neutral.
- The test environment is the Linux one: `docker/docker-compose.suite-ci-e2e.yml` with the same
  image pins and the same `containers` default, started by Docker inside WSL2.
  `yarn workspace @trezor/suite-e2e test-env:windows <image> <services>`, the script
  `suite/e2e/scripts/windows/start-test-env.ts`, imports the stock Ubuntu 24.04 WSL image,
  installs Docker from the Ubuntu archive as a systemd service listening on `127.0.0.1:2375`,
  runs `docker compose up` inside WSL, because bind mount paths are resolved by the client, and
  exports `DOCKER_HOST`, so the Docker CLI on Windows drives the daemon like a local one. The
  distro stays up between steps through a detached `wsl.exe` session the script leaves behind,
  which `wsl --shutdown` ends. WSL forwards Windows loopback to the services, so the hardcoded
  `127.0.0.1` addresses in the tests and in Suite work unchanged. Mirrored WSL networking is
  unsupported on the hosted runners, NAT is the only mode.
- Four runners share one Currents run through orchestration, project `q2uGxh`, tag `windows`.
- Tests are selected by `playwright-desktop-windows.config.ts`: `@windows` tests on T3W1, T3T1
  for its exclusive tests, and `no_device`. Tag a test `@windows` when it exercises the Electron
  main process or OS integration.
- The test run, the log attachment and the teardown are the Linux template's steps in Git Bash,
  with the Windows Playwright config and `upload-test-logs` falling back to 7-Zip for the archive.

## Running it yourself

- CI: `gh workflow run test-suite-desktop-e2e-win-nightly.yml --ref <branch>`, which builds the
  app and runs the subset.
- Locally on Windows: download the Ubuntu image the template names, run
  `yarn workspace @trezor/suite-e2e test-env:windows <image> trezor-user-env-unix`, set
  `DOCKER_HOST=tcp://127.0.0.1:2375` and run Playwright with `playwright-desktop-windows.config.ts`
  against the desktop build extracted into `suite/desktop-app`. A Windows VM with nested
  virtualization on a Linux workstation works.
- The test code itself is platform-agnostic: a failure that reproduces on Linux with the Docker
  trezor-user-env is a test bug, one that does not is the Windows finding.

## Known Windows differences

- Electron keeps the single-instance lock as a kernel object, not a file in user data, so a second
  Suite instance is always refused there. Tests must wait for a previous app to exit before
  launching their own.
- The Connect permissions modal names the calling process `Node.js`, not `node`.
