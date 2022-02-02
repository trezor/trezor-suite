import { useCallback } from 'react';
import type { Account } from '@wallet-types';
import * as routerActions from '@suite-actions/routerActions';
import { useActions } from '@suite-hooks';

export const useInvityNavigation = (account: Account) => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    type WalletInvityRouteNameType = Extract<Parameters<typeof goto>[0], `wallet-invity-${string}`>;
    const useNavigateToRouteName = (routeName: WalletInvityRouteNameType) =>
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
        navigateToInvityLogin: useNavigateToRouteName('wallet-invity-login'),
        navigateToInvityRegistration: useNavigateToRouteName('wallet-invity-registration'),
        navigateToInvityRegistrationSuccessful: useNavigateToRouteName(
            'wallet-invity-registration-successful',
        ),
        navigateToInvityAccountVerified: useNavigateToRouteName('wallet-invity-account-verified'),
        navigateToInvityUserInfo: useNavigateToRouteName('wallet-invity-user-info'),
        navigateToInvityPhoneNumberVerification: useNavigateToRouteName(
            'wallet-invity-phone-number-verification',
        ),
        navigateToInvityKYCStart: useNavigateToRouteName('wallet-invity-kyc-start'),
        navigateToInvityAML: useNavigateToRouteName('wallet-invity-aml'),
    };
};
