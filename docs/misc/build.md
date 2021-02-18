# Front-End Build
The front-end build of Suite is handled by Webpack configurations inside the `suite-build` package.

The folder structure is as follows:
- configs: Contains the Webpack configuration files. `base.webpack.config.ts` serves as a common base for all other configurations. The other files in this folder are project specific such as `web.webpack.config.ts` or `desktop.webpack.config.ts` for `suite-web` and `suite-desktop` respectively. 
- plugins: Contains custom Webpack plugins.
- utils: Contains various utils for the build scripts.

These Webpack configurations are using TypeScript and use the `tsconfig.json` file at the root of the package. This is specified via the `TS_NODE_PROJECT` environment variable to avoid any issues regardless of the location where the command is run.

The following commands are available in this package (using `yarn run` at the root of the package or `yarn workspace @trezor/suite-build run` at the root of the project):
| Command | Description |
| --- | --- |
| dev:web | Runs a watch build of `suite-web` with development settings and serves it. |
| build:web | Builds a production build of `suite-web`. |
| dev:desktop | Runs a watch build of `suite-desktop` with development settings, serves it and runs the Electron wrapper. |
| build:desktop | Builds a production build of `suite-desktop`. |
| lint | Runs the linter on the package. |
| type-check | Runs the TypeScript checker on the package. |
| type-check:watch | Same as `type-check` but in watch mode. |

## Aliases
Aliases for imports (for example `@suite-utils/features`) are defined in the `tsconfig.json` file at the root of the project, in the `compilerOptions.paths` property. The values are processed at build time for the webpack configuration in order to properly resolve aliases.

