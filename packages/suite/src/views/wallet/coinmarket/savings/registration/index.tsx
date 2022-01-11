import React from 'react';
import { useSelector } from '@suite-hooks';
import { withCoinmarketSavingsLoaded, WithCoinmarketLoadedProps } from '@wallet-components';
import invityAPI from '@suite-services/invityAPI';
import { useCoinmarketNavigation } from '@wallet-hooks/useCoinmarketNavigation';
import { Button } from '@trezor/components';
import RegistrationSuccess from './components/Success';
import { getRoute } from '@suite-utils/router';

type CoinmarketSavingsLoginRgistrationProps = WithCoinmarketLoadedProps;

const CoinmarketSavingsRegistration = ({
    selectedAccount,
}: CoinmarketSavingsLoginRgistrationProps) => {
    const { invityAuthentication } = useSelector(state => ({
        invityAuthentication: state.wallet.coinmarket.invityAuthentication,
    }));
    const { navigateToSavingsLogin } = useCoinmarketNavigation(selectedAccount.account);
    const afterVerificationReturnToPath = getRoute('wallet-coinmarket-savings-account-verified', {
        symbol: selectedAccount.account.symbol,
        accountIndex: selectedAccount.account.index,
        accountType: selectedAccount.account.accountType,
    });
    return (
        <>
            <Button onClick={() => navigateToSavingsLogin()}>Navigate to Login</Button>
            {!invityAuthentication && (
                <iframe
                    title="registration"
                    frameBorder="0"
                    src={invityAPI.getRegistrationPageSrc(afterVerificationReturnToPath)}
                    sandbox="allow-scripts allow-forms allow-same-origin"
                />
            )}
            {invityAuthentication && !invityAuthentication.verified && <RegistrationSuccess />}
        </>
    );
};

export default withCoinmarketSavingsLoaded(CoinmarketSavingsRegistration, {
    checkInvityAuthenticationImmediately: false,
});
