import { DelegatedIdentityKey, TrezorDeviceWithState } from '@suite-common/suite-types';
import type { DeviceCancelledErrType, DeviceErrorType } from '@suite-common/wallet-types';
import { Result } from '@trezor/type-utils';

export type EnsureDelegatedIdentityKeyParams = {
    device: Pick<
        TrezorDeviceWithState,
        'id' | 'path' | 'state' | 'instance' | 'useEmptyPassphrase' | 'thp'
    >;
};

export type EnsureDelegatedIdentityKey = (
    params: EnsureDelegatedIdentityKeyParams,
) => Promise<Result<DelegatedIdentityKey, DeviceErrorType | DeviceCancelledErrType>>;

export type EnsureDelegatedIdentityKeyDep = {
    ensureDelegatedIdentityKey: EnsureDelegatedIdentityKey;
};
