import { useEffect, useState } from 'react';

import { mapTestnetSymbol, tradingExchangeActions } from '@suite-common/trading';
import { selectAccounts, selectSelectedDevice } from '@suite-common/wallet-core';
import { AccountKey, SelectedAccountLoaded } from '@suite-common/wallet-types';
import { isTestnet } from '@suite-common/wallet-utils';

import { setTradingSellAccountKey } from 'src/actions/wallet/tradingSellActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { TradingTradeSellExchangeType } from 'src/types/trading/trading';
import { tradingGetSortedAccounts } from 'src/utils/wallet/trading/tradingUtils';

interface TradingUseAccountKeyProps {
    type: TradingTradeSellExchangeType;
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
    type,
    tradingAccountKey,
    selectedAccount,
    shouldUseTradingAccountKey,
}: TradingUseAccountKeyProps): [AccountKey, (state: AccountKey) => void] => {
    const dispatch = useDispatch();
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

    // update accountKey in store
    useEffect(() => {
        if (!shouldUseTradingAccountKey) {
            if (type === 'sell') {
                dispatch(setTradingSellAccountKey(accountKey));
            } else {
                dispatch(tradingExchangeActions.setTradingAccountKey(accountKey));
            }
        }
    }, [accountKey, dispatch, shouldUseTradingAccountKey, type]);

    return [accountKey, setAccountKey];
};
