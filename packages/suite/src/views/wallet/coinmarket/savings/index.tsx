import React, { useEffect } from 'react';
import { withCoinmarketSavingsLoaded, WithSelectedAccountLoadedProps } from '@wallet-components';
import { useSavings } from '@wallet-hooks/coinmarket/savings/useSavings';
import UnsupportedCountry from './unsupported-country';
import { useInvityNavigation } from '@wallet-hooks/useInvityNavigation';

const CoinmarketSavingsLoaded = ({ selectedAccount }: WithSelectedAccountLoadedProps) => {
    const {
        navigateToInvityLogin,
        navigateToInvityUserInfo,
        navigateToInvityPhoneNumberVerification,
        navigateToInvityKYCStart,
        navigateToInvityAML,
    } = useInvityNavigation(selectedAccount.account);
    const {
        isClientFromUnsupportedCountry,
        shouldRegisterUserInfo,
        shouldVerifyPhoneNumber,
        shouldKYCStart,
        shouldAML,
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
            return;
        }
        if (shouldAML) {
            navigateToInvityAML();
        }
    }, [
        navigateToInvityAML,
        navigateToInvityKYCStart,
        navigateToInvityLogin,
        navigateToInvityPhoneNumberVerification,
        navigateToInvityUserInfo,
        shouldAML,
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
