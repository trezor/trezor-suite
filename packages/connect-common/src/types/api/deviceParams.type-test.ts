// Methods that never talk to a device (`useDevice = false` at runtime) must not accept `device`
// or `keepSession` on either tier — both parameters are silently ignored by them.

import type { TrezorConnectPrivilegedAPI, TrezorConnectPublicAPI } from '../../index';
import { asDeviceUniquePath } from '../device';

const device = { path: asDeviceUniquePath('1') };

export const deviceFreeMethodsOnPrivilegedTier = (api: TrezorConnectPrivilegedAPI) => {
    api.blockchainGetInfo({ coin: 'btc' });
    // @ts-expect-error blockchainGetInfo does not use a device
    api.blockchainGetInfo({ coin: 'btc', device });
    // @ts-expect-error blockchainGetInfo does not keep a session
    api.blockchainGetInfo({ coin: 'btc', keepSession: true });

    // @ts-expect-error blockchainEstimateFee does not use a device
    api.blockchainEstimateFee({ coin: 'btc', device });
    // @ts-expect-error blockchainSubscribe does not use a device
    api.blockchainSubscribe({ coin: 'btc', blocks: true, device });
    // @ts-expect-error blockchainUnsubscribe does not use a device
    api.blockchainUnsubscribe({ coin: 'btc', blocks: true, device });
    // @ts-expect-error getCoinInfo does not use a device
    api.getCoinInfo({ coin: 'btc', device });
    // @ts-expect-error selectAccount does not use a device
    api.selectAccount({ coin: 'btc', device });
};

export const deviceFreeMethodsOnPublicTier = (api: TrezorConnectPublicAPI<Record<string, any>>) => {
    api.blockchainGetInfo({ coin: 'btc' });
    // @ts-expect-error blockchainGetInfo does not use a device
    api.blockchainGetInfo({ coin: 'btc', device });

    // `call()` stays the loose escape hatch the popup host forwards foreign payloads through.
    api.call({ method: 'blockchainGetInfo', coin: 'btc', device });
};
