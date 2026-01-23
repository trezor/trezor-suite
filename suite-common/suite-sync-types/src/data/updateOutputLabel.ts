import { SuiteSyncUpdateError } from '@suite-common/suite-sync-storage';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountDescriptor,
    DeviceCancelledErrType,
    DeviceErrorType,
} from '@suite-common/wallet-types';
import type { StaticSessionId } from '@trezor/connect';
import { Result } from '@trezor/type-utils';

import { SuiteSyncUnavailableOnDeviceErrorType } from '../refreshSuiteSyncKeys';
import { SuiteSyncFirmwareUpgradeNeededDeviceErrorType } from '../storage/ensureWalletSuiteSyncOn';

type UpdateOutputLabelParams = {
    deviceStaticSessionId: StaticSessionId;
    txId: string;
    outputIndex: number;
    label: string | null;
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
};

export type UpdateOutputLabel = (
    params: UpdateOutputLabelParams,
) => Promise<
    Result<
        void,
        | SuiteSyncUnavailableOnDeviceErrorType
        | SuiteSyncFirmwareUpgradeNeededDeviceErrorType
        | DeviceErrorType
        | DeviceCancelledErrType
        | SuiteSyncUpdateError
    >
>;

export type UpdateOutputLabelDep = { updateOutputLabel: UpdateOutputLabel };
