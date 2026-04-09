import { type AnalyticsSharedEvents, events } from '@suite-common/analytics';
import { type Account } from '@suite-common/wallet-types';
import { type Analytics } from '@trezor/analytics-uploader';

import { selectAccounts } from './accountsSelectors';

const countNonZeroBalanceAccounts = (accounts: Account[]) =>
    accounts.filter(a => Number(a.balance) > 0).length;

export const reportWalletBalanceState = ({
    accounts,
    analytics,
}: {
    accounts: Account[];
    analytics: Analytics<AnalyticsSharedEvents>;
}) => {
    analytics.report({
        type: events.walletBalanceEvent.name,
        payload: { nonZeroBalance: countNonZeroBalanceAccounts(accounts) },
    });
};

export const reportWalletBalanceChangeIfNeeded = ({
    prevAccounts,
    getState,
    analytics,
}: {
    prevAccounts: Account[];
    getState: () => { wallet: { accounts: Account[] } };
    analytics: Analytics<AnalyticsSharedEvents>;
}) => {
    const prevCount = countNonZeroBalanceAccounts(prevAccounts);
    const nextCount = countNonZeroBalanceAccounts(selectAccounts(getState()));

    if (prevCount !== nextCount) {
        analytics.report({
            type: events.walletBalanceEvent.name,
            payload: { nonZeroBalance: nextCount },
        });
    }
};
