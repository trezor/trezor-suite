import { useCallback } from 'react';

import { Account } from 'src/types/wallet';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';

export const useTradingNavigation = (account: Account) => {
    const dispatch = useDispatch();

    type WalletTradingRouteNameType = Extract<
        Parameters<typeof goto>[0],
        `wallet-trading-${string}`
    >;
    const useNavigateToRouteName = (routeName: WalletTradingRouteNameType) =>
        useCallback(() => {
            dispatch(
                goto(routeName, {
                    params: {
                        symbol: account.symbol,
                        accountIndex: account.index,
                        accountType: account.accountType,
                    },
                }),
            );
        }, [routeName]);

    return {
        navigateToBuyForm: useNavigateToRouteName('wallet-trading-buy'),
        navigateToBuyOffers: useNavigateToRouteName('wallet-trading-buy-offers'),
        navigateToBuyDetail: useNavigateToRouteName('wallet-trading-buy-detail'),
        navigateToBuyConfirm: useNavigateToRouteName('wallet-trading-buy-confirm'),

        navigateToExchangeForm: useNavigateToRouteName('wallet-trading-exchange'),
        navigateToExchangeOffers: useNavigateToRouteName('wallet-trading-exchange-offers'),
        navigateToExchangeDetail: useNavigateToRouteName('wallet-trading-exchange-detail'),
        navigateToExchangeConfirm: useNavigateToRouteName('wallet-trading-exchange-confirm'),

        navigateToSellForm: useNavigateToRouteName('wallet-trading-sell'),
        navigateToSellOffers: useNavigateToRouteName('wallet-trading-sell-offers'),
        navigateToSellConfirm: useNavigateToRouteName('wallet-trading-sell-confirm'),
    };
};
