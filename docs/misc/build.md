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

Both applications share `packages/suite/webpack/browserslist`, for Babel's `preset-env` and as their
Webpack target. Electron ships a newer Chromium than the browsers that list covers, so the desktop
renderer could target it separately, but today it does not.

The file is referenced by absolute path. Babel and Webpack otherwise discover browserslist config by
walking up from the directory the build runs in, which silently changes the targets when a build
moves.

## Aliases

Aliases for imports (for example `@suite-utils/features`) are defined in the `tsconfig.json` file at
the root of the project, in the `compilerOptions.paths` property. The values are processed at build
time for the webpack configuration in order to properly resolve aliases.
