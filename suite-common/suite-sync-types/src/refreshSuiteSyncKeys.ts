import { ProofOfDelegatedSignFailedType } from '@suite-common/delegated-identity-key-types';
import { CreateSuiteSyncOwnerError } from '@suite-common/suite-sync-storage';
import { TrezorDevice } from '@suite-common/suite-types';
import { DeviceCancelledErrType, DeviceErrorType } from '@suite-common/wallet-types';
import { Result } from '@trezor/type-utils';

type RefreshSuiteSyncKeysParams = {
    device: TrezorDevice;
};

export type RefreshSuiteKeysUnavailable = {
    type: 'RefreshSuiteKeysUnavailable';
};

/**
 * Device is not connected or device is in a state/configuration, that does not
 * support Suite Sync.
 */
export const RefreshSuiteKeysUnavailable = (): RefreshSuiteKeysUnavailable => ({
    type: 'RefreshSuiteKeysUnavailable',
});

export type RefreshSuiteSyncKeys = (
    params: RefreshSuiteSyncKeysParams,
) => Promise<
    Result<
        void,
        | DeviceErrorType
        | DeviceCancelledErrType
        | RefreshSuiteKeysUnavailable
        | ProofOfDelegatedSignFailedType
        | CreateSuiteSyncOwnerError
    >
>;
