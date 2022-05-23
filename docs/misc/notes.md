# Weird stuff, notes and issues

-   [Android emulator no internet](https://stackoverflow.com/questions/42736038/android-emulator-not-able-to-access-the-internet)

-   [Tests for custom hooks in suite are ignored (modulePathIgnorePatterns: '<rootDir>/src/utils/suite/hooks')](./packages/suite/jest.config.js)

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

### Upload source maps to Sentry

1. ` sentry-cli releases -o satoshilabs -p trezor-suite files <COMMIT> upload-sourcemaps ./build`
