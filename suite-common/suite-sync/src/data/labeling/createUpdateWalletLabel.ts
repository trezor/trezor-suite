import {
    type EnsureWalletSuiteSyncOnDep,
    type UpdateWalletLabel,
} from '@suite-common/suite-sync-types';
import { type WalletDescriptor } from '@suite-common/wallet-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';

import {
    type SuiteSyncAnalyticsDep,
    getLabelAction,
    reportLabelEvent,
} from '../../suiteSyncAnalytics';

type GetWalletLabelDep = {
    getWalletLabel: (walletDescriptor: WalletDescriptor) => string | null;
};

export type UpdateWalletLabelDeps = EnsureWalletSuiteSyncOnDep &
    SuiteSyncAnalyticsDep &
    GetWalletLabelDep;

export const createUpdateWalletLabel =
    (deps: UpdateWalletLabelDeps): UpdateWalletLabel =>
    async ({ deviceStaticSessionId, label }) => {
        const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);
        const previousLabel = deps.getWalletLabel(walletDescriptor);

        const ensureWalletOnResult = await deps.ensureWalletSuiteSyncOn({
            deviceStaticSessionId,
            isWriteMode: true,
        });

        if (!ensureWalletOnResult.success) {
            return ensureWalletOnResult;
        }

        const result = await ensureWalletOnResult.payload.data.wallets.update({
            walletDescriptor,
            label,
        });

        if (result.success && label) {
            reportLabelEvent(deps.analytics, 'wallet', undefined, getLabelAction(previousLabel));
        }

        return result;
    };
