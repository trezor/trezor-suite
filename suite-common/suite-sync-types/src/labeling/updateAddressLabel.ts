import { NetworkSymbol } from '@suite-common/wallet-config';
import { Account, DeviceCancelledErrType, DeviceErrorType } from '@suite-common/wallet-types';
import type { StaticSessionId } from '@trezor/connect';
import { Result } from '@trezor/type-utils';

import { RefreshSuiteKeysUnavailable } from '../refreshSuiteSyncKeys';

export type UpdateAddressLabelParams = {
    deviceStaticSessionId: StaticSessionId;
    address: string;
    label: string | null;
    accountDescriptor: Account['descriptor'];
    networkSymbol: NetworkSymbol;
};

export type UpdateAddressLabel = (
    params: UpdateAddressLabelParams,
) => Promise<Result<void, RefreshSuiteKeysUnavailable | DeviceErrorType | DeviceCancelledErrType>>;

export type UpdateAddressLabelDep = { updateAddressLabel: UpdateAddressLabel };
