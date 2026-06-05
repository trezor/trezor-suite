import { type WriteWalletLabel } from '@suite-common/suite-sync-types';
import { type WalletDescriptor, parseStaticSessionId } from '@trezor/device-utils';

import {
    type SuiteSyncAnalyticsDep,
    getLabelAction,
    reportLabelEvent,
} from '../../../suiteSyncAnalytics';

type GetWalletLabelDep = {
    getWalletLabel: (walletDescriptor: WalletDescriptor) => string | null;
};

export type WriteWalletLabelDeps = SuiteSyncAnalyticsDep & GetWalletLabelDep;

export const createWriteWalletLabel =
    (deps: WriteWalletLabelDeps): WriteWalletLabel =>
    ({ storage, data: { deviceStaticSessionId, label } }) => {
        const { walletDescriptor } = parseStaticSessionId(deviceStaticSessionId);
        const previousLabel = deps.getWalletLabel(walletDescriptor);

        const result = storage.data.wallets.update({
            walletDescriptor,
            label,
        });

        if (result.success && label) {
            reportLabelEvent(deps.analytics, 'wallet', undefined, getLabelAction(previousLabel));
        }

        return result;
    };
