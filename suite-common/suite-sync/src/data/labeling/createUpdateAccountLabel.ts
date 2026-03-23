import {
    type EnsureWalletSuiteSyncOnDep,
    type UpdateAccountLabel,
} from '@suite-common/suite-sync-types';
import { parseAccountKey } from '@suite-common/wallet-utils';

export type UpdateAccountLabelDeps = EnsureWalletSuiteSyncOnDep;

export const createUpdateAccountLabel =
    (deps: UpdateAccountLabelDeps): UpdateAccountLabel =>
    async ({ deviceStaticSessionId, accountKey, label }) => {
        const ensureWalletOnResult = await deps.ensureWalletSuiteSyncOn({
            deviceStaticSessionId,
            isWriteMode: true,
        });

        if (!ensureWalletOnResult.success) {
            return ensureWalletOnResult;
        }

        const { accountDescriptor, networkSymbol } = parseAccountKey(accountKey);

        return ensureWalletOnResult.payload.data.accounts.update({
            accountDescriptor,
            networkSymbol,
            label,
        });
    };
