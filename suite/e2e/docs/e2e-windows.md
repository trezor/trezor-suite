# Desktop e2e on Windows

`template-suite-run-e2e-windows.yml` runs the `@windows` subset of the desktop e2e tests on
GitHub-hosted `windows-latest` runners. The nightly workflow calls it next to the Linux groups,
`test-suite-desktop-e2e-win-nightly.yml` is the manual run for a branch.

## How it runs

- Playwright and the Electron app run on Windows. The app bundle is the `desktop-app-build-e2e`
  artifact of the calling workflow's build job, built on Linux and platform-neutral.
- trezor-user-env runs inside WSL2. Its CI publishes the Linux root filesystem as an OCI artifact,
  `ghcr.io/trezor/trezor-user-env-rootfs`, tagged like the image. The template pins the tag and
  `update-trezor-user-env.yml` bumps it together with the Docker image pin, so Linux and Windows run
  the same trezor-user-env. The script pulls it, imports it with `wsl --import` and starts the
  controller. WSL forwards
  Windows loopback to it, so the hardcoded `127.0.0.1` addresses in the tests and in Suite work
  unchanged. Mirrored WSL networking is unsupported on the hosted runners, NAT is the only mode.
- Four runners share one Currents run through orchestration, project `q2uGxh`, tag `windows`.
- Tests are selected by `playwright-desktop-windows.config.ts`: `@windows` tests on T3W1, T3T1
  for its exclusive tests, and `no_device`. Tag a test `@windows` when it exercises the Electron
  main process or OS integration.
- The job body is `yarn workspace @trezor/suite-e2e test:e2e:windows`, the script
  `suite/e2e/scripts/windows/run-e2e.ts`. It starts trezor-user-env, runs the tests and collects
  the logs in one process because a process started by a step does not survive it on the runner.

## Running it yourself

- CI: `gh workflow run test-suite-desktop-e2e-win-nightly.yml --ref <branch>`, which builds the
  app and runs the subset.
- Locally on Windows: the same script with the same `--rootfs-ref`, or `--rootfs <file>` for a
  tarball already on disk, and the desktop build extracted into `suite/desktop-app`. Without
  `CURRENTS_RECORD_KEY` the script uses plain Playwright. A Windows VM with nested virtualization on a Linux workstation works.
- The test code itself is platform-agnostic: a failure that reproduces on Linux with the Docker
  trezor-user-env is a test bug, one that does not is the Windows finding.

## Known Windows differences

- Electron keeps the single-instance lock as a kernel object, not a file in user data, so a second
  Suite instance is always refused there. Tests must wait for a previous app to exit before
  launching their own.
- The Connect permissions modal names the calling process `Node.js`, not `node`.

## Later

- The trezor-user-env stuck protection in `support/setup.ts` restarts a Docker container; on
  Windows it does nothing, a WSL restart is needed.
