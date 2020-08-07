import { useSelector } from 'react-redux';
import { AppState } from '@suite-types';
import { useState, useEffect } from 'react';
import { BuyInfo, loadBuyInfo } from '@wallet-actions/coinmarketActions';
import invityAPI from '@suite/services/invityAPI/service';

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

export function useBuyInfo() {
    const [buyInfo, setBuyInfo] = useState<BuyInfo>({
        providerInfos: {},
        supportedFiatCurrencies: new Set<string>(),
        supportedCryptoCurrencies: new Set<string>(),
    });
    const selectedAccount = useSelector<AppState, AppState['wallet']['selectedAccount']>(
        state => state.wallet.selectedAccount,
    );

    useEffect(() => {
        if (selectedAccount.status === 'loaded') {
            invityAPI.createInvityAPIKey(selectedAccount.account?.descriptor);
            loadBuyInfo().then(bi => {
                setBuyInfo(bi);
            });
        }
    }, [selectedAccount]);

    return { buyInfo };
}
