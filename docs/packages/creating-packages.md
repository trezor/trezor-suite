# How to create new package?

1. Use `yarn generate-package your-package-name` - it will generate package boilerplate in `packages/your-package-name`.

## How to use this new package?

1. Place this package to dependency field to package.json in package where you want to use it.
1. Run `yarn refs` to generate tsconfig refs.
1. Run `yarn` to let yarn symlink this package.
