import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import {
    type TradingRootStateWithDeviceAndAccounts,
    type TradingTransaction,
    isFinalStatus,
    selectDeviceTradingTrades,
} from '@suite-common/trading';
import { selectDeviceAccounts } from '@suite-common/wallet-core';
import { type Account, type AccountKey } from '@suite-common/wallet-types';

export type TradesToWatchByAccount = {
    account: Account;
    trades: TradingTransaction[];
};

const createTradesToWatchSelector =
    createWeakMapSelector.withTypes<TradingRootStateWithDeviceAndAccounts>();

const getTradeAccountKey = (trade: TradingTransaction): AccountKey | undefined =>
    'selectedAccountKey' in trade ? trade.selectedAccountKey : trade.sendAccountKey;

const shouldWatchTrade = ({ tradeType, data }: TradingTransaction) =>
    data.status !== undefined && !isFinalStatus(tradeType, data.status);

export const selectDeviceTradesToWatchByAccount = createTradesToWatchSelector(
    [selectDeviceTradingTrades, selectDeviceAccounts],
    (trades, accounts) => {
        const accountsByKey = new Map(accounts.map(account => [account.key, account]));
        const groupsByAccountKey = new Map<AccountKey, TradesToWatchByAccount>();

        trades.filter(shouldWatchTrade).forEach(trade => {
            const accountKey = getTradeAccountKey(trade);
            const account = accountKey ? accountsByKey.get(accountKey) : undefined;

            if (!account) {
                return;
            }

            const group = groupsByAccountKey.get(account.key);

            if (group) {
                group.trades.push(trade);
            } else {
                groupsByAccountKey.set(account.key, { account, trades: [trade] });
            }
        });

        return returnStableArrayIfEmpty([...groupsByAccountKey.values()]);
    },
);
