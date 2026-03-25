---
name: packages
description: How to create and structure packages in the Trezor Suite monorepo, including scopes and sizing guidance. Use when creating new packages or resolving cyclic dependencies.
---

# Packages

## How to create packages

Use command `yarn generate-package @scope/newPackageName`. For example using name `@suite-common/wallet` will create package in `/suite-common` folder. Full list of scopes:

| Scope         | Folder        | Description                                   | Imports from              |
| ------------- | ------------- | --------------------------------------------- | ------------------------- |
| @trezor\*     | /packages     | public packages used by Suite & third parties | No other scope!           |
| @suite-common | /suite-common | code shared between @suite and @suite native  | @trezor                   |
| @suite-native | /suite-native | mobile Suite                                  | @trezor and @suite-common |
| @suite        | /suite        | desktop & web Suite                           | @trezor and @suite-common |

\* TODO: @trezor was originally the only scope in the monorepo and some packages (including desktop entry point!) should be in the @suite scope instead

## Packages size

Smaller is better.

Big packages usually lead to cyclic dependencies. Imagine this pattern:

1. I have `packageA` which has type `FormInput` and there are multiple forms in this package that need this type
2. I have `packageB` which also has a form that needs to use `FormInput` so you import it from `packageA`
3. Now you want to add this form, alongside others into your main `packageA` but you can't because it will cause cyclic dependency.

Now you have two options how to solve it:

1. You can merge `packageB` into `packageA`, but it will only amplify this cyclic deps issue for other packages. More things you will have in `packageA`, then more often you need to use `packageA` in other packages, but that will prevent you from importing any of that packages back into `packageA` because of cyclic dependency. That will force you to place everything into `packageA` which will grow into a monolith (that's the exact thing that happened in packages/suite).
2. You can create `packageC` which will contain this `FormInput` and both `packageA` and `packageB` can use it.

So creating smaller packages from start is always better, because you have much lower chances to run into issue with cyclic dependencies, but not only that. Smaller packages give you better control of what you will use in other packages, you can run smaller subsets of tests, lints etc which is faster.
