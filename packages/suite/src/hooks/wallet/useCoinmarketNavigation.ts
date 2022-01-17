import { useCallback } from 'react';
import { Account } from '@wallet-types';
import * as routerActions from '@suite-actions/routerActions';
import { useActions } from '@suite-hooks';

export const useCoinmarketNavigation = (account: Account) => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    type WalletCoinmarketRouteNameType = Extract<
        Parameters<typeof goto>[0],
        `wallet-coinmarket-${string}`
    >;
    const useNavigateToRouteName = (routeName: WalletCoinmarketRouteNameType) =>
        useCallback(() => {
            goto(routeName, {
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            });
        }, [routeName]);

    return {
        navigateToBuyForm: useNavigateToRouteName('wallet-coinmarket-buy'),
        navigateToBuyOffers: useNavigateToRouteName('wallet-coinmarket-buy-offers'),
        navigateToBuyDetail: useNavigateToRouteName('wallet-coinmarket-buy-detail'),

        navigateToExchangeForm: useNavigateToRouteName('wallet-coinmarket-exchange'),
        navigateToExchangeOffers: useNavigateToRouteName('wallet-coinmarket-exchange-offers'),
        navigateToExchangeDetail: useNavigateToRouteName('wallet-coinmarket-exchange-detail'),

        navigateToSellForm: useNavigateToRouteName('wallet-coinmarket-sell'),
        navigateToSellOffers: useNavigateToRouteName('wallet-coinmarket-sell-offers'),

        navigateToSavings: useNavigateToRouteName('wallet-coinmarket-savings'),
        navigateToSavingsSignIn: useNavigateToRouteName('wallet-coinmarket-savings-sign-in'),
        navigateToSavingsLogin: useNavigateToRouteName('wallet-coinmarket-savings-login'),
        navigateToSavingsRegistration: useNavigateToRouteName(
            'wallet-coinmarket-savings-registration',
        ),
        navigateToSavingsRegistrationSuccessful: useNavigateToRouteName(
            'wallet-coinmarket-savings-registration-successful',
        ),
        navigateToSavingsAccountVerified: useNavigateToRouteName(
            'wallet-coinmarket-savings-account-verified',
        ),
        navigateToSavingsUserInfo: useNavigateToRouteName('wallet-coinmarket-savings-user-info'),
        navigateToSavingsPhoneNumberVerification: useNavigateToRouteName(
            'wallet-coinmarket-savings-phone-number-verification',
        ),
        navigateToSavingsKYCStart: useNavigateToRouteName('wallet-coinmarket-savings-kyc-start'),
    };
};
