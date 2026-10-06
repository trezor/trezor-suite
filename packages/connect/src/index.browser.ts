import { type TrezorConnectPrivilegedAPI, factoryPrivileged } from '@trezor/connect-common';

import { CoreInModuleWeb } from './impl/core-in-module-web';

type TrezorConnectBrowserAPI = TrezorConnectPrivilegedAPI & {
    requestWebUSBDevice: () => Promise<void>;
};

// Exported to enable using directly
const TrezorConnect: TrezorConnectBrowserAPI = factoryPrivileged(new CoreInModuleWeb());

export default TrezorConnect;

// allowed only here
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
export * from './exports';

if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        TrezorConnect.dispose();
    });
}
