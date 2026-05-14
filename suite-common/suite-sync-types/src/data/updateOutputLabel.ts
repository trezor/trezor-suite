import { type SuiteSyncUpdateError } from '@suite-common/suite-sync-storage';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountDescriptor, type TxTargetId } from '@suite-common/wallet-types';
import type { StaticSessionId } from '@trezor/connect';
import { type Result } from '@trezor/type-utils';

import { type EnsureWalletSuiteSyncOnErrors } from '../storage/ensureWalletSuiteSyncOn';

export type UpdateOutputLabelParams = {
    deviceStaticSessionId: StaticSessionId;
    txId: string;
    txTargetId: TxTargetId;
    label: string | null;
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
};

export type UpdateOutputLabel = (
    params: UpdateOutputLabelParams,
) => Promise<Result<void, EnsureWalletSuiteSyncOnErrors | SuiteSyncUpdateError>>;

export type UpdateOutputLabelDep = { updateOutputLabel: UpdateOutputLabel };
