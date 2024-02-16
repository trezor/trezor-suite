import { LogBox } from 'react-native';

// Ignore log notification by message
LogBox.ignoreLogs([
    'empty lock queue', // locking not implemented in suite-native https://github.com/trezor/trezor-suite/blob/0498c2ef4c0a61ff56fc60cff0f545636592814d/packages/transport/src/sessions/background.ts#L274
]);
