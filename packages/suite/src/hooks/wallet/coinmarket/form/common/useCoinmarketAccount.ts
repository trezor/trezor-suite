import { selectAccounts, selectDevice } from '@suite-common/wallet-core';
import { Account, SelectedAccountLoaded } from '@suite-common/wallet-types';
import { isTestnet } from '@suite-common/wallet-utils';
import { useState } from 'react';
import { useSelector } from 'src/hooks/suite';
import {
    coinmarketGetSortedAccounts,
    mapTestnetSymbol,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';

interface CoinmarketUseAccountProps {
    coinmarketAccount: Account | undefined;
    selectedAccount: SelectedAccountLoaded;
    isNotFormPage?: boolean;
}

export const useCoinmarketAccount = ({
    coinmarketAccount,
    selectedAccount,
    isNotFormPage,
}: CoinmarketUseAccountProps): [Account, (state: Account) => void] => {
    const accounts = useSelector(selectAccounts);
    const device = useSelector(selectDevice);

    // coinmarketAccount is used on offers page
    // if is testnet, use
    // selectedAccount is used as initial state if this is form page
    const [account, setAccount] = useState<Account>(() => {
        if (coinmarketAccount && isNotFormPage) {
            return coinmarketAccount;
        }

        if (isTestnet(selectedAccount.account.symbol)) {
            const defaultSymbol = mapTestnetSymbol(selectedAccount.account.symbol);
            const accountsSorted = coinmarketGetSortedAccounts({
                accounts,
                deviceState: device?.state,
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
