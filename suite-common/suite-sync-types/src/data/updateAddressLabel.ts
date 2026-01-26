import { SuiteSyncUpdateError } from '@suite-common/suite-sync-storage';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountDescriptor } from '@suite-common/wallet-types';
import type { StaticSessionId } from '@trezor/connect';
import { Result } from '@trezor/type-utils';

import { EnsureWalletSuiteSyncOnErrors } from '../storage/ensureWalletSuiteSyncOn';

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
