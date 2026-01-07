import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountDescriptor,
    DeviceCancelledErrType,
    DeviceErrorType,
} from '@suite-common/wallet-types';
import type { StaticSessionId } from '@trezor/connect';
import { Result } from '@trezor/type-utils';

import { RefreshSuiteKeysUnavailableType } from '../refreshSuiteSyncKeys';

export type UpdateAddressLabelParams = {
    deviceStaticSessionId: StaticSessionId;
    address: string;
    label: string | null;
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
};

export type UpdateAddressLabel = (
    params: UpdateAddressLabelParams,
) => Promise<
    Result<void, RefreshSuiteKeysUnavailableType | DeviceErrorType | DeviceCancelledErrType>
>;

export type UpdateAddressLabelDep = { updateAddressLabel: UpdateAddressLabel };
