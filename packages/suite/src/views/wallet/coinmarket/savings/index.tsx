import React, { useEffect } from 'react';
import { withCoinmarketSavingsLoaded } from '@wallet-components';
import { useSavings } from '@wallet-hooks/coinmarket/savings/useSavings';
import UnsupportedCountry from './unsupported-country';
import type { CoinmarketSavingsLoadedProps } from '@wallet-types/coinmarket/savings';
import { useCoinmarketNavigation } from '@wallet-hooks/useCoinmarketNavigation';

const CoinmarketSavingsLoaded = ({ selectedAccount }: CoinmarketSavingsLoadedProps) => {
    const {
        navigateToSavingsLogin,
        navigateToSavingsUserInfo,
        navigateToSavingsPhoneNumberVerification,
        navigateToSavingsKYCStart,
    } = useCoinmarketNavigation(selectedAccount.account);
    const {
        invityAuthentication,
        isLoading,
        isClientFromUnsupportedCountry,
        shouldLogin,
        shouldRegisterUserInfo,
        shouldVerifyPhoneNumber,
        shouldKYCStart,
    } = useSavings();

    // TODO: There must be better way how to navigate than this:
    useEffect(() => {
        if (shouldLogin) {
            navigateToSavingsLogin();
            return;
        }
        if (shouldRegisterUserInfo) {
            navigateToSavingsUserInfo();
            return;
        }
        if (shouldVerifyPhoneNumber) {
            navigateToSavingsPhoneNumberVerification();
            return;
        }
        if (shouldKYCStart) {
            navigateToSavingsKYCStart();
        }
    }, [
        navigateToSavingsKYCStart,
        navigateToSavingsLogin,
        navigateToSavingsPhoneNumberVerification,
        navigateToSavingsUserInfo,
        shouldKYCStart,
        shouldLogin,
        shouldRegisterUserInfo,
        shouldVerifyPhoneNumber,
    ]);

    return (
        <>
            {invityAuthentication?.verified && !isLoading && (
                <>
                    Logged in user
                    <br />
                    <p>
                        {invityAuthentication.email ? invityAuthentication.email : 'Unknown user'}
                    </p>
                    <p>
                        User id:{' '}
                        {invityAuthentication.accountInfo
                            ? invityAuthentication.accountInfo.id
                            : 'Unknown user'}
                    </p>
                    <p>phoneNumber: {invityAuthentication.accountInfo?.settings?.phoneNumber}</p>
                    <p>
                        phoneNumberVerified:{' '}
                        {invityAuthentication.accountInfo?.settings?.phoneNumberVerified}
                    </p>
                    <p>givenName: {invityAuthentication.accountInfo?.settings?.givenName}</p>
                    <p>familyName: {invityAuthentication.accountInfo?.settings?.familyName}</p>
                    <hr />
                </>
            )}
            {/* TODO: Redirect to UnsupportedCountry */}
            {isClientFromUnsupportedCountry && <UnsupportedCountry />}
        </>
    );
};

export default withCoinmarketSavingsLoaded(CoinmarketSavingsLoaded);
