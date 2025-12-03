import { EncryptionUnavailable } from '@suite-common/secure-storage';
import { DelegatedIdentityKey, TrezorDeviceWithState } from '@suite-common/suite-types';
// Circular issue, see: https://github.com/trezor/trezor-suite/issues/21553
import { selectThp } from '@suite-common/thp/src/thpSelectors';
import { Result, ok } from '@trezor/type-utils';

import { DeviceCancelledErr, DeviceError } from '../deviceUtils';
import { GetDelegatedIdentityKey } from './getDelegatedIdentityKey';
import { retrieveDelegatedIdentityKey } from './retrieveDelegatedIdentityKey';
import { SaveDelegatedIdentityKey } from './saveDelegatedIdentityKey';

type EnsureDelegatedIdentityKeyParams = {
    device: TrezorDeviceWithState;
};

export type EnsureDelegatedIdentityKey = (
    params: EnsureDelegatedIdentityKeyParams,
) => Promise<
    Result<DelegatedIdentityKey, DeviceError | DeviceCancelledErr | EncryptionUnavailable>
>;

type EnsureDelegatedIdentityKeyDeps = {
    getState: () => any;
    getDelegatedIdentityKey: GetDelegatedIdentityKey;
    saveDelegatedIdentityKey: SaveDelegatedIdentityKey;
};

export const createEnsureDelegatedIdentityKey =
    (deps: EnsureDelegatedIdentityKeyDeps): EnsureDelegatedIdentityKey =>
    async ({ device }) => {
        const currentDelegatedKey = await deps.getDelegatedIdentityKey({
            deviceId: device.id,
        });

        if (currentDelegatedKey !== null) {
            return ok(currentDelegatedKey);
        }

        const thpStaticHostKey = selectThp(deps.getState()).staticKey;
        const result = await retrieveDelegatedIdentityKey({ device, thpStaticHostKey });

        if (!result.ok) {
            return result;
        }

        await deps.saveDelegatedIdentityKey({
            deviceId: device.id,
            delegatedIdentityKey: result.value,
        });

        return ok(result.value);
    };
