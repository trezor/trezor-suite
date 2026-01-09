# @suite-native/storybook

This package contains the Storybook setup for the Trezor Suite mobile app. If you are unfamiliar with Storybook, please refer to the [Storybook documentation](https://storybook.js.org/docs/get-started/whats-a-story).

## 📱 Storybook for React Native (Mobile)

To see the components at their most exact representation run the Storybook directly in the mobile app native environment (Android/iOS) where is the Storybook integrated directly into the mobile application as a screen.

All the relevant source code is located in the [.rnstorybook](.rnstorybook) directory.

### How to run

1. Run mobile app application. See [@suite-native/app README](../app/README.md) for more details.

- make sure that you have debug or preview build of the app running. TODO

2. Open the **Dev Utils** screen in the app. and click on the **StoryBook** button.
    - _Settings > Dev Utils > StoryBook_

3. The Storybook UI will load, allowing you to browse and test components on the device/simulator.

### what is `storybook.requires.ts` file?

Unlike the web, which scans for stories files dynamically, React Native Metro bundler requires this auto-generated manifest to help the Metro bundler "find" and load stories on-device. It is updated automatically whenever you launch the app in debug build and metro server is running. In case you would need to generate it manually, you can do so by running the following command:

```bash
yarn workspace @suite-native/storybook storybook:generate
```

Make sure to always push this auto-generated file to the git repository. so the newly created stories are available in the app for everyone.

## 🌐 Storybook for Web

For convenience of the designers and other teams, the mobile Storybook is also configured for the web environment. The [react-native-web](https://necolas.github.io/react-native-web/) and [@storybook/react-native-web-vite](https://storybook.js.org/docs/get-started/frameworks/react-native-web-vite?renderer=react-native-web) libraries are used for it. Bear in mind that Suite mobile app does not use `react-native-web` for production and the web Storybook is not tested regularly. So there might be present some design discrepancies. If you want to see exact 1:1 UI representation of the components refer to the previous section and run the storybook on Android/iOS device directly.

All the relevant source code is located in the [.storybook](.storybook) directory.

### How to run locally

Run the following command from the root of the monorepo:

```bash
yarn workspace @suite-native/storybook storybook:web
```

This will start the Storybook development server at `http://localhost:6006`.

### Remote deployment

Whenever the `@suite-native/storybook` package or any `stories.tsx` files are updated and merged into the develop branch, these changes are automatically deployed to the remote server through a [GitHub Actions workflow](../../.github/workflows/build-storybook-native.yml).

The deployed storybook is available at https://dev.suite.sldev.cz/suite-mobile/components/develop/.
