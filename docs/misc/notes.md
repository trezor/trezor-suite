# Weird stuff, notes and issues

-   [Android emulator no internet](https://stackoverflow.com/questions/42736038/android-emulator-not-able-to-access-the-internet)

-   [Typing connected component using redux-thunk action creators](https://github.com/piotrwitek/react-redux-typescript-guide#typing-connected-component-using-redux-thunk-action-creators)

-   [Notes on React Native setup inside a monorepo](./packages/componentsStorybookNative/README.md)

-   [Tests for custom hooks in suite are ignored (modulePathIgnorePatterns: '<rootDir>/src/utils/suite/hooks')](./packages/suite/jest.config.js)

## Things to do in future

### Bridge in electron

-   package.json > "build": { "asar": false } required
-   How to get bridge version?
-   Test windows

### Debugging Electron build

-   macOS: Run `/path/to/app/TrezorSuite.app/Contents/MacOS/TrezorSuite --debug`
-   Decompile: `npx asar extract packages/suite-desktop/build-electron/mac/TrezorSuite.app/Contents/Resources/app.asar ./decompiled`

### Remove IndexedDB from desktop
To remove a database remove following folder:

#### Windows
`C:\Users\<user>\AppData\Roaming\@trezor\suite-desktop\IndexedDB`

#### Linux
`/home/<user>/.config/@trezor/suite-desktop/IndexedDB`

#### macOS
`/Users/<user>/Library/Application Support/@trezor/suite-desktop/IndexedDB`

### Clearing Electron cache
To clear electron cache delete following folder:

#### Windows
`C:\Users\<user>\AppData\Roaming\@trezor\suite-desktop\Cache`

#### Linux
`/home/<user>/.config/@trezor/suite-desktop/Cache`

#### macOS
`/Users/<user>/Library/ApplicationSupport/@trezor/suite-desktop/Cache`


## Tests

-   All suite tests use **UTC timezone** (set in [jest.config.js#L2](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/jest.config.js#L2))

# React-native tsconfig regex:

copy block from top level tsconfig.json
find: `./packages/suite/src/(.*)"`
replace: `./src/$1", "../../packages/suite/src/$1"`

# Debugging suite-web on android

Server needs to be running on https in order to have access to `navigator.usb` functionality

-   Generate localhost certificate:
    yarn workspace @trezor/suite-web cert

-   Run https server:
    yarn workspace @trezor/suite-web dev:https

-   Find your ip:
    ifconfig | grep "inet "

-   Connect phone (dev mode) to computer
-   Access suite using IP (it needs to be in the same network as your computer)
-   Open debugger:
    chrome://inspect/#devices

# How to release - staging

`git checkout releases`

`yarn`

## Suite web release

1. `assetPrefix=/wallet yarn workspace @trezor/suite-web build`
2. `cd packages/suite-web`
3. `cd build/static`
4. `mkdir desktop`
5. copy desktop apps into the folder (Trezor Suite.(zip, AppImage, exe)).

![Image of Yaktocat](https://i.imgur.com/4bQSMKO.png)

7. `./scripts/s3sync.sh stage beta` (from the `packages/suite-web` folder )

### Upload source maps to Sentry
1. ` sentry-cli releases -o satoshilabs -p trezor-suite files <COMMIT> upload-sourcemaps ./build`
