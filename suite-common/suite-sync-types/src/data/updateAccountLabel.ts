import { SuiteSyncUpdateError } from '@suite-common/suite-sync-storage';
import { type DeviceCancelledErrType, DeviceErrorType } from '@suite-common/wallet-types';
import type { StaticSessionId } from '@trezor/connect';
import { Result } from '@trezor/type-utils';

import { SuiteSyncUnavailableOnDeviceErrorType } from '../refreshSuiteSyncKeys';

export type UpdateAccountLabelParams = {
    deviceStaticSessionId: StaticSessionId;
    accountKey: string;
    label: string | null;
};

export type UpdateAccountLabel = (
    params: UpdateAccountLabelParams,
) => Promise<
    Result<
        void,
        | SuiteSyncUnavailableOnDeviceErrorType
        | DeviceErrorType
        | DeviceCancelledErrType
        | SuiteSyncUpdateError
    >
>;

export type UpdateAccountLabelDep = { updateAccountLabel: UpdateAccountLabel };
