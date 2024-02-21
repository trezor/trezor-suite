# monorepo-global-types

This package contains global types for the monorepo. It is automatically included in all packages in the monorepo because Typescript automatically inject types from `node_modules/@types` into the global scope. That's reason why this module use `@types` scope and not standard `@trezor` scope.

Use this with caution and primary for missing types of 3rd party libs.
