import { type TrezorConnectPrivilegedAPI, factoryPrivileged } from '@trezor/connect-common';

import { CoreInModuleNode } from './impl/core-in-module-node';

const TrezorConnect: TrezorConnectPrivilegedAPI = factoryPrivileged(new CoreInModuleNode());

export default TrezorConnect;

// allowed only here
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
export * from './exports';
