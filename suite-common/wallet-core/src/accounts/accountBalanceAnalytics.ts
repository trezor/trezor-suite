import debounce from 'lodash/debounce';

import { type AnalyticsSharedEvents, events } from '@suite-common/analytics';
import { type Account } from '@suite-common/wallet-types';
import { isAccountWatchOnly } from '@suite-common/wallet-utils';
import { type Analytics } from '@trezor/analytics-uploader';

import { selectAccounts } from './accountsSelectors';

const DEBOUNCE_MS = 5 * 60 * 1000; // 5 minutes

export const countNonZeroBalanceAccounts = (accounts: Account[]) =>
    accounts.filter(account => !isAccountWatchOnly(account) && Number(account.balance) > 0).length;

type ReportParams = {
    getState: () => { wallet: { accounts: Account[] } };
    analytics: Analytics<AnalyticsSharedEvents>;
};

/**
 * Report wallet balance state with leading + trailing debounce.
 *
 * First call fires immediately (leading edge). Subsequent calls within
 * 10 minutes are debounced — a trailing event fires 10 minutes after
 * the last call to capture the settled state.
 */
export const reportWalletBalanceDebounced = debounce(
    ({ getState, analytics }: ReportParams) => {
        analytics.report({
            type: events.walletBalanceEvent.name,
            payload: {
                nonZeroBalance: countNonZeroBalanceAccounts(selectAccounts(getState())),
            },
        });
    },
    DEBOUNCE_MS,
    { leading: true, trailing: true },
);
