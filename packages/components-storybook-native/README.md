# Components Storybook Native

## Notes on current setup
- Created basic react-native app using `react-native init`. Added dependency on `@trezor/components`. Storybook integration can be added later when version 5 will be more mature. https://storybook.js.org/docs/guides/guide-react-native/

- Because of monorepo structure and react-native limited capabilities there had to be some changes made to an iOS and Android projects https://dev.to/brunolemos/tutorial-100-code-sharing-between-ios-android--web-using-react-native-web-andmonorepo-4pej

- Using camelCase for the package name:
    ```
    react-native upgrade will fail if you change the project name from camelCase to kabob-case. So while you can run the project this way, you're stuck there without additional workarounds.
    ```

- Project root for the Metro bundler is set to root of the monorepo. It relies on `react-native` that is hoisted to root node_modules. Package's local `react-native` installed in `/packages/<name>/node_modules/react-native` are ignored. The idea is that there will be only one version of the lib used across all packages and it is the one from `suite-native`. The second reason is that I couldn't get it working with local react-native using nohoist for the whole package. Could be worth it to try it again though ([some reading mateiral](https://github.com/connectdotz/yarn-nohoist-examples/tree/master/workspaces-examples/react-native)).
    ```
    blacklistRE: blacklist([
            /packages\/.*\/node_modules\/react-native\/.*/,
            /node_modules\/.*\/node_modules\/react-native\/.*/,
        ]),
    ```

- To prevent hoisting wrong version of `react-native` (from package other than `suite-native`) there is `workspaces.nohoist` field inside monorepo's root `package.json`
    ```
    "nohoist": ["!(suite-native)/react-native", "!(suite-native)/react-native/**"]
    ``` 
