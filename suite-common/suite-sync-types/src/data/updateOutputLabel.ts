import type { NetworkSymbol } from '@suite-common/wallet-config';
import { DeviceCancelledErrType, DeviceErrorType } from '@suite-common/wallet-types';
import type { StaticSessionId } from '@trezor/connect';
import { Result } from '@trezor/type-utils';

import { RefreshSuiteKeysUnavailableType } from '../refreshSuiteSyncKeys';

type UpdateOutputLabelParams = {
    deviceStaticSessionId: StaticSessionId;
    txId: string;
    outputIndex: number;
    label: string | null;
    accountDescriptor: string;
    networkSymbol: NetworkSymbol;
};

export type UpdateOutputLabel = (
    params: UpdateOutputLabelParams,
) => Promise<
    Result<void, RefreshSuiteKeysUnavailableType | DeviceErrorType | DeviceCancelledErrType>
>;

export type UpdateOutputLabelDep = { updateOutputLabel: UpdateOutputLabel };
