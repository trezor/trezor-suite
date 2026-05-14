import {
    type EnsureWalletSuiteSyncOnDep,
    type UpdateAccountLabel,
} from '@suite-common/suite-sync-types';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountDescriptor, type WalletDescriptor } from '@suite-common/wallet-types';
import { parseAccountKey, parseDeviceStaticSessionId } from '@suite-common/wallet-utils';

import {
    type SuiteSyncAnalyticsDep,
    getLabelAction,
    reportLabelEvent,
} from '../../suiteSyncAnalytics';

type GetAccountLabelDep = {
    getAccountLabel: (
        walletDescriptor: WalletDescriptor | null,
        accountDescriptor: AccountDescriptor,
        networkSymbol: NetworkSymbol,
    ) => string | null;
};

export type UpdateAccountLabelDeps = EnsureWalletSuiteSyncOnDep &
    SuiteSyncAnalyticsDep &
    GetAccountLabelDep;

export const createUpdateAccountLabel =
    (deps: UpdateAccountLabelDeps): UpdateAccountLabel =>
    async ({ deviceStaticSessionId, accountKey, label }) => {
        const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);
        const { accountDescriptor, networkSymbol } = parseAccountKey(accountKey);
        const previousLabel = deps.getAccountLabel(
            walletDescriptor,
            accountDescriptor,
            networkSymbol,
        );

        const ensureWalletOnResult = await deps.ensureWalletSuiteSyncOn({
            deviceStaticSessionId,
            isWriteMode: true,
        });

        if (!ensureWalletOnResult.success) {
            return ensureWalletOnResult;
        }

        const result = await ensureWalletOnResult.payload.data.accounts.update({
            accountDescriptor,
            networkSymbol,
            label,
        });

        if (result.success && label) {
            reportLabelEvent(
                deps.analytics,
                'account',
                networkSymbol,
                getLabelAction(previousLabel),
            );
        }

        return result;
    };
