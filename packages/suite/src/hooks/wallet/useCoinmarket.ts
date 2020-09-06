import { useSelector } from 'react-redux';
import { AppState } from '@suite-types';
import { useState, useEffect } from 'react';
import invityAPI from '@suite-services/invityAPI';
import { ExchangeInfo, loadExchangeInfo } from '@suite/actions/wallet/coinmarketExchangeActions';

export const useExchange = () => {
    const router = useSelector<AppState, AppState['router']>(state => state.router);
    const selectedAccount = useSelector<AppState, AppState['wallet']['selectedAccount']>(
        state => state.wallet.selectedAccount,
    );

    return {
        app: router.app,
        router,
        selectedAccount,
    };
};

export const useAllAccounts = () => {
    const accounts = useSelector<AppState, AppState['wallet']['accounts']>(
        state => state.wallet.accounts,
    );
    return accounts;
};

export function useExchangeInfo() {
    const [exchangeInfo, setExchangeInfo] = useState<ExchangeInfo>({
        providerInfos: {},
        buySymbols: new Set<string>(),
        sellSymbols: new Set<string>(),
    });

    const selectedAccount = useSelector<AppState, AppState['wallet']['selectedAccount']>(
        state => state.wallet.selectedAccount,
    );

    useEffect(() => {
        if (selectedAccount.status === 'loaded') {
            invityAPI.createInvityAPIKey(selectedAccount.account?.descriptor);
            loadExchangeInfo().then(i => {
                setExchangeInfo(i);
            });
        }
    }, [selectedAccount]);

    return { exchangeInfo };
}
