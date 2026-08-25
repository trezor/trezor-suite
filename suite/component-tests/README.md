# @suite/component-tests

Playwright component tests for the Suite web/desktop app. Tests run in Node; components render in
Chromium. A test navigates to a **gallery** page served from this package, mounts one **story** by
id, and asserts on the DOM — via the built-in
[`mount` fixture](https://playwright.dev/docs/test-components) of `@playwright/test`.

No device, bridge, backend or running Suite instance is involved.

## Setup

Yarn scripts are disabled repo-wide, so `yarn` does not install Playwright's browsers:

```bash
yarn
yarn workspace @suite/component-tests exec playwright install chromium --with-deps
```

## Running

```bash
yarn workspace @suite/component-tests test:component     # rebuild gallery, run against bundle
yarn workspace @suite/component-tests test:component:ui  # Playwright UI mode, for live debugging
```

`test:component:ui` serves the gallery from the Vite dev server instead of the bundle. Every mount
is far slower, but source is served live, which is what live debugging needs.

Run from inside the package to drop the `yarn workspace @suite/component-tests` prefix.

### Filtering and debugging

Anything after the script name is passed to Playwright:

```bash
yarn test:component tests/stakeForm.test.ts
yarn test:component -g "rejects an amount"
```

A trace is recorded for every test, and is read with Playwright directly:

```bash
yarn workspace @suite/component-tests  playwright show-trace
```

## Story Ids

Story ids are the path under `stories/` minus the extension, plus the export name —
`stakeForm/EthereumStakeInputs` mounts the `EthereumStakeInputs` export of
`stories/stakeForm.story.tsx`.

## Known constraints

- **Stories live here, not next to their components**, which needs the deep-import exception in
  `eslint.config.mjs`.
- **The bundler setup is shared with the app build**: aliases and plugins come from
  `packages/suite-build/viteShared.ts`, the browser polyfills from
  `packages/suite-build/browserPolyfills.ts`.
