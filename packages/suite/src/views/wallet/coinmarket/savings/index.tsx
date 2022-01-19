import React, { useEffect } from 'react';
import { withCoinmarketSavingsLoaded } from '@wallet-components';
import { useSavings } from '@wallet-hooks/coinmarket/savings/useSavings';
import UnsupportedCountry from './unsupported-country';
import type { CoinmarketSavingsLoadedProps } from '@wallet-types/coinmarket/savings';
import { useInvityNavigation } from '@wallet-hooks/useInvityNavigation';

const CoinmarketSavingsLoaded = ({ selectedAccount }: CoinmarketSavingsLoadedProps) => {
    const {
        navigateToInvityLogin,
        navigateToInvityUserInfo,
        navigateToInvityPhoneNumberVerification,
        navigateToInvityKYCStart,
    } = useInvityNavigation(selectedAccount.account);
    const {
        isClientFromUnsupportedCountry,
        shouldRegisterUserInfo,
        shouldVerifyPhoneNumber,
        shouldKYCStart,
    } = useSavings();

    // TODO: There must be better way how to navigate than this:
    useEffect(() => {
        if (shouldRegisterUserInfo) {
            navigateToInvityUserInfo();
            return;
        }
        if (shouldVerifyPhoneNumber) {
            navigateToInvityPhoneNumberVerification();
            return;
        }
        if (shouldKYCStart) {
            navigateToInvityKYCStart();
        }
    }, [
        navigateToInvityKYCStart,
        navigateToInvityLogin,
        navigateToInvityPhoneNumberVerification,
        navigateToInvityUserInfo,
        shouldKYCStart,
        shouldRegisterUserInfo,
        shouldVerifyPhoneNumber,
    ]);

    // TODO: translations
    return (
        <>
            {/* TODO: Redirect to UnsupportedCountry */}
            {isClientFromUnsupportedCountry && <UnsupportedCountry />}
        </>
    );
};

export default withCoinmarketSavingsLoaded(CoinmarketSavingsLoaded, {
    title: 'TR_NAV_SAVINGS',
    checkInvityAuthenticationImmediately: true,
    redirectUnauthorizedUserToLogin: false,
});
