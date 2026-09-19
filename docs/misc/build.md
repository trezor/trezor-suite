# Front-End Build

Each application owns its Webpack configuration. `@suite/web-app` and `@suite/desktop-app-renderer`
each have a `webpack.config.ts` composing the shared pieces with their own targets, entry points and
assets.

The shared pieces live in `packages/suite/webpack`, next to the application code both applications
bundle:

- `createBaseConfig.ts`: common compilation, polyfills, chunking, source maps and the security
  check. Takes the application's `suiteType` and `baseDir` explicitly.
- `createDevConfig.ts`: development server and refresh setup. Takes the served `distPath` and `port`
  explicitly.
- `nixosInterpreterPlugin.ts`, `shellSpawnPlugin.ts`: custom Webpack plugins.
- `browserPolyfills.ts`, `env.ts`, `git.ts`: build helpers.

These configurations are written in TypeScript and load through the `tsconfig.webpack.json` of the
owning application, specified via `TS_NODE_PROJECT` so the command works regardless of where it runs.

| Command                                            | Description                                                                   |
| -------------------------------------------------- | ----------------------------------------------------------------------------- |
| `yarn workspace @suite/web-app dev`                | Watch build of the web application with development settings, and serves it.  |
| `yarn workspace @suite/web-app build`              | Production build of the web application.                                      |
| `yarn workspace @suite/desktop-app dev`            | Watch build of the desktop renderer, serves it and runs the Electron wrapper. |
| `yarn workspace @suite/desktop-app-renderer build` | Production build of the desktop renderer bundle.                              |

The root shortcuts `yarn suite:dev`, `yarn suite:build:web` and `yarn suite:dev:desktop` call these.

## Browser targets

Each application owns its own browserslist file passed to `createBaseConfig` and applied to Babel and Webpack target for
syntax transpilation and polyfills.
In case of Web, the list is pinned to actual browser versions that we support.
Meanwhile, Desktop is shipped with its own browser, so it supports only the exact Chromium version included in the
current version of Electron.

Each file is referenced by absolute path. Babel and Webpack otherwise discover browserslist config by
walking up from the directory the build runs in, which silently changes the targets when a build
moves; a bare `browserslist:<query>` Webpack target is worse still, since a discoverable browserslist
file in the build context makes Webpack treat the query string as an environment name in that file
rather than as a query, silently falling back to the file's default list instead of throwing.

## Aliases

Aliases for imports (for example `@suite-utils/features`) are defined in the `tsconfig.json` file at
the root of the project, in the `compilerOptions.paths` property. The values are processed at build
time for the webpack configuration in order to properly resolve aliases.
