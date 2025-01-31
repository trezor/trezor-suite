import { useState } from 'react';

import { mapTestnetSymbol } from '@suite-common/trading';
import { selectAccounts, selectSelectedDevice } from '@suite-common/wallet-core';
import { AccountKey, SelectedAccountLoaded } from '@suite-common/wallet-types';
import { isTestnet } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';
import { tradingGetSortedAccounts } from 'src/utils/wallet/trading/tradingUtils';

interface TradingUseAccountKeyProps {
    tradingAccountKey: AccountKey | undefined;
    selectedAccount: SelectedAccountLoaded;
    shouldUseTradingAccountKey?: boolean;
}

/**
 * Hook used to get account key of selected account for trade form (used in Sell/Swap)
 *  - coinmarketAccount is used whether user is in the trading flow (persistent)
 *  - selectedAccount is used as initial state if user entries from different page than trade
 */
export const useTradingAccountKey = ({
    tradingAccountKey,
    selectedAccount,
    shouldUseTradingAccountKey,
}: TradingUseAccountKeyProps): [AccountKey, (state: AccountKey) => void] => {
    const accounts = useSelector(selectAccounts);
    const device = useSelector(selectSelectedDevice);

    const [accountKey, setAccountKey] = useState<AccountKey>(() => {
        if (tradingAccountKey && shouldUseTradingAccountKey) {
            return tradingAccountKey;
        }

        if (isTestnet(selectedAccount.account.symbol) && !selectedAccount.network.tradeCryptoId) {
            const defaultSymbol = mapTestnetSymbol(selectedAccount.account.symbol);
            const accountsSorted = tradingGetSortedAccounts({
                accounts,
                deviceState: device?.state?.staticSessionId,
            });

            const accountNotInTestnet = accountsSorted.find(a => a.symbol === defaultSymbol);

            // return account which is on production network, if account is discovered
            if (accountNotInTestnet) return accountNotInTestnet.key;
            // return first account if default symbol is not found
            if (accountsSorted[0]) return accountsSorted[0].key;
        }

        return selectedAccount.account.key;
    });

    return [accountKey, setAccountKey];
};
