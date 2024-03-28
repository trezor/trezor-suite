import { LogBox } from 'react-native';

import Constants from 'expo-constants';

const IS_DETOX_BUILD: boolean = Constants.expoConfig?.extra?.isDetoxBuild;

// Ignore log notification by message
LogBox.ignoreLogs([
    'empty lock queue', // locking not implemented in suite-native https://github.com/trezor/trezor-suite/blob/0498c2ef4c0a61ff56fc60cff0f545636592814d/packages/transport/src/sessions/background.ts#L274
]);

// LogBox has to be disabled in the Detox test build, because UI is being hidden behind it and Detox cannot interact with it.
if (IS_DETOX_BUILD) {
    LogBox.ignoreAllLogs();
}
