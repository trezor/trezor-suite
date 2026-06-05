import { type WriteAccountLabel } from '@suite-common/suite-sync-types';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountDescriptor } from '@suite-common/wallet-types';
import { parseAccountKey } from '@suite-common/wallet-utils';
import { type WalletDescriptor, parseStaticSessionId } from '@trezor/device-utils';

import {
    type SuiteSyncAnalyticsDep,
    getLabelAction,
    reportLabelEvent,
} from '../../../suiteSyncAnalytics';

type GetAccountLabelDep = {
    getAccountLabel: (
        walletDescriptor: WalletDescriptor | null,
        accountDescriptor: AccountDescriptor,
        networkSymbol: NetworkSymbol,
    ) => string | null;
};

export type WriteAccountLabelDeps = SuiteSyncAnalyticsDep & GetAccountLabelDep;

export const createWriteAccountLabel =
    (deps: WriteAccountLabelDeps): WriteAccountLabel =>
    ({ storage, data: { deviceStaticSessionId, accountKey, label } }) => {
        const { walletDescriptor } = parseStaticSessionId(deviceStaticSessionId);
        const { accountDescriptor, networkSymbol } = parseAccountKey(accountKey);
        const previousLabel = deps.getAccountLabel(
            walletDescriptor,
            accountDescriptor,
            networkSymbol,
        );

        const result = storage.data.accounts.update({
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
