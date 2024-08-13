import { useCallback } from 'react';
import { Account } from 'src/types/wallet';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';

export const useCoinmarketNavigation = (account: Account) => {
    const dispatch = useDispatch();

    type WalletCoinmarketRouteNameType = Extract<
        Parameters<typeof goto>[0],
        `wallet-coinmarket-${string}`
    >;
    const useNavigateToRouteName = (routeName: WalletCoinmarketRouteNameType) =>
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
        navigateToBuyForm: useNavigateToRouteName('wallet-coinmarket-buy'),
        navigateToBuyOffers: useNavigateToRouteName('wallet-coinmarket-buy-offers'),
        navigateToBuyDetail: useNavigateToRouteName('wallet-coinmarket-buy-detail'),
        navigateToBuyOffer: useNavigateToRouteName('wallet-coinmarket-buy-confirm'),

        navigateToExchangeForm: useNavigateToRouteName('wallet-coinmarket-exchange'),
        navigateToExchangeOffers: useNavigateToRouteName('wallet-coinmarket-exchange-offers'),
        navigateToExchangeDetail: useNavigateToRouteName('wallet-coinmarket-exchange-detail'),

        navigateToSellForm: useNavigateToRouteName('wallet-coinmarket-sell'),
        navigateToSellOffers: useNavigateToRouteName('wallet-coinmarket-sell-offers'),
        navigateToSellOffer: useNavigateToRouteName('wallet-coinmarket-sell-confirm'),
    };
};
