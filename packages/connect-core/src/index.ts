import { type TrezorConnectPrivilegedAPI, factoryPrivileged } from '@trezor/connect-common';

import { CoreInModule } from './impl/core-in-module';

// Platform-neutral composition root. Core never selects concrete transports; a host consuming
// core directly injects its own through `init({ transports })`. The public entry points
// (@trezor/connect and the thin clients) own the per-environment defaults.
class CoreInModuleLocal extends CoreInModule {
    protected defaultTransports() {
        return [];
    }
}

const TrezorConnect: TrezorConnectPrivilegedAPI = factoryPrivileged(new CoreInModuleLocal());

export default TrezorConnect;

// allowed only here
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
export * from './exports';
