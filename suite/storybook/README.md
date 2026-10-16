# @suite/storybook

The shared web/desktop component catalog for every `@suite/*` workspace, `@trezor/product-components`
and `@trezor/suite`.
Stories stay beside the components they document; the host discovers them from the root workspace manifest.
Other workspaces, including `@trezor/components`, `@suite-common/*` and `@suite-native/*`, are excluded.

## Run locally

After the normal repository dependency installation, run:

```sh
yarn workspace @suite/storybook storybook
```

Open http://localhost:9004. To generate the static catalog:

```sh
yarn workspace @suite/storybook storybook-build
```

The output is `.build-storybook/`. The nightly pipeline publishes it at
https://dev.suite.sldev.cz/product-components/develop/, preserving the previous catalog URL.

## Add a story

Use `ComponentName.stories.tsx` as the only story filename convention. Storybook discovers these files
anywhere inside the included workspaces, including outside `src/`. Installed dependencies are excluded.
No component registration is required.
Restart Storybook after adding the first story to a new workspace. Each workspace's package name prefixes
its stories in the sidebar, so features can use their own component titles.

Declare the Storybook packages imported by the story in its owning workspace. Use the normal full
repository install: the catalog can discover stories outside the host's dependency graph, and a focused
installation may omit their dependencies.

The shared preview supplies light/dark themes and the existing network configuration fixture.
Supply any additional feature dependencies or providers through the story's own decorators and args.
Keep example data local and use callbacks or mocks instead of submitting feedback or calling services.
