import { type SuiteSyncUpdateError } from '@suite-common/suite-sync-storage';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountDescriptor } from '@suite-common/wallet-types';
import type { StaticSessionId } from '@trezor/connect';
import { type Result } from '@trezor/type-utils';

import { type EnsureWalletSuiteSyncOnErrors } from '../storage/ensureWalletSuiteSyncOn';

export type UpdateAddressLabelParams = {
    deviceStaticSessionId: StaticSessionId;
    address: string;
    label: string | null;
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
};

export type UpdateAddressLabel = (
    params: UpdateAddressLabelParams,
) => Promise<Result<void, EnsureWalletSuiteSyncOnErrors | SuiteSyncUpdateError>>;

export type UpdateAddressLabelDep = { updateAddressLabel: UpdateAddressLabel };
