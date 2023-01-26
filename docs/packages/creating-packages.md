# How to create new package?

1. Use `yarn generate-package @scope/new-package-name` - it will generate package boilerplate in `scope/new-package-name` folder.

## How to use this new package?

1. Place this package to dependency field of package.json in package where you want to use it.
1. Run `yarn refs` to generate tsconfig refs.
1. Run `yarn` to let yarn symlink this package.
