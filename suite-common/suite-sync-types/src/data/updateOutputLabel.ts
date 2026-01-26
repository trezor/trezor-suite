import { SuiteSyncUpdateError } from '@suite-common/suite-sync-storage';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountDescriptor } from '@suite-common/wallet-types';
import type { StaticSessionId } from '@trezor/connect';
import { Result } from '@trezor/type-utils';

import { EnsureWalletSuiteSyncOnErrors } from '../storage/ensureWalletSuiteSyncOn';

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
) => Promise<Result<void, EnsureWalletSuiteSyncOnErrors | SuiteSyncUpdateError>>;

export type UpdateOutputLabelDep = { updateOutputLabel: UpdateOutputLabel };
