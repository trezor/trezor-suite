import { type TrezorConnectPrivilegedAPI, factoryPrivileged } from '@trezor/connect-common';

import { CoreInModuleNative } from './impl/core-in-module-native';

const TrezorConnect: TrezorConnectPrivilegedAPI = factoryPrivileged(new CoreInModuleNative());

export default TrezorConnect;

// allowed only here
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
export * from './exports';
