import React, { useEffect } from 'react';
import { withCoinmarketSavingsLoaded, WithCoinmarketLoadedProps } from '@wallet-components';
import { useCoinmarketNavigation } from '@wallet-hooks/useCoinmarketNavigation';
import invityAPI from '@suite-services/invityAPI';
import { Button } from '@trezor/components';
import { useSelector } from '@suite-hooks';

type CoinmarketSavingsLoginProps = WithCoinmarketLoadedProps;

const CoinmarketSavingsLogin = ({ selectedAccount }: CoinmarketSavingsLoginProps) => {
    const { invityAuthentication } = useSelector(state => ({
        invityAuthentication: state.wallet.coinmarket.invityAuthentication,
    }));
    const { navigateToSavings, navigateToSavingsRegistration } = useCoinmarketNavigation(
        selectedAccount.account,
    );

    useEffect(() => {
        if (invityAuthentication?.verified) {
            navigateToSavings();
        }
    }, [navigateToSavings, invityAuthentication?.verified]);
    return (
        <>
            <Button onClick={() => navigateToSavingsRegistration()}>
                Navigate to Registration
            </Button>
            <iframe
                title="login"
                frameBorder="0"
                src={invityAPI.getLoginPageSrc()}
                sandbox="allow-scripts allow-forms allow-same-origin"
            />
        </>
    );
};

export default withCoinmarketSavingsLoaded(CoinmarketSavingsLogin, {
    checkInvityAuthenticationImmediately: false,
});
