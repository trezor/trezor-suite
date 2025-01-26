import { useState } from 'react';

import { selectAccounts, selectSelectedDevice } from '@suite-common/wallet-core';
import { Account, SelectedAccountLoaded } from '@suite-common/wallet-types';
import { isTestnet } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';
import {
    coinmarketGetSortedAccounts,
    mapTestnetSymbol,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';

interface CoinmarketUseAccountProps {
    coinmarketAccount: Account | undefined;
    selectedAccount: SelectedAccountLoaded;
    shouldUseCoinmarketAccount?: boolean;
}
/**
 * Hook used to get account for trade form (used in Sell/Swap)
 *  - coinmarketAccount is used whether user is in the trading flow (persistent)
 *  - selectedAccount is used as initial state if user entries from different page than trade
 */
export const useCoinmarketAccount = ({
    coinmarketAccount,
    selectedAccount,
    shouldUseCoinmarketAccount,
}: CoinmarketUseAccountProps): [Account, (state: Account) => void] => {
    const accounts = useSelector(selectAccounts);
    const device = useSelector(selectSelectedDevice);

    const [account, setAccount] = useState<Account>(() => {
        if (coinmarketAccount && shouldUseCoinmarketAccount) {
            return coinmarketAccount;
        }

        if (isTestnet(selectedAccount.account.symbol) && !selectedAccount.network.tradeCryptoId) {
            const defaultSymbol = mapTestnetSymbol(selectedAccount.account.symbol);
            const accountsSorted = coinmarketGetSortedAccounts({
                accounts,
                deviceState: device?.state?.staticSessionId,
            });

            const accountNotInTestnet = accountsSorted.find(a => a.symbol === defaultSymbol);

            // return account which is on production network, if account is discovered
            if (accountNotInTestnet) return accountNotInTestnet;
            // return first account if default symbol is not found
            if (accountsSorted[0]) return accountsSorted[0];
        }

        return selectedAccount.account;
    });

    return [account, setAccount];
};
