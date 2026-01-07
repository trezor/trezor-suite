import { SuiteSyncUpdateError } from '@suite-common/suite-sync-storage';
import { DeviceCancelledErrType, DeviceErrorType } from '@suite-common/wallet-types';
import type { StaticSessionId } from '@trezor/connect';
import { Result } from '@trezor/type-utils';

import { RefreshSuiteKeysUnavailableType } from '../refreshSuiteSyncKeys';

export type UpdateWalletLabelParams = {
    deviceStaticSessionId: StaticSessionId;
    label: string | null;
};

export type UpdateWalletLabel = (
    params: UpdateWalletLabelParams,
) => Promise<
    Result<
        void,
        | RefreshSuiteKeysUnavailableType
        | DeviceErrorType
        | DeviceCancelledErrType
        | SuiteSyncUpdateError
    >
>;

export type UpdateWalletLabelDep = { updateWalletLabel: UpdateWalletLabel };
