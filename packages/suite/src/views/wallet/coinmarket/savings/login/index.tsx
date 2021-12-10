import React, { useContext, useEffect } from 'react';
import { useSelector } from '@suite-hooks';
import { CoinmarketLayout, WalletLayout } from '@wallet-components';
import CoinmarketAuthentication, {
    CoinmarketAuthenticationContext,
} from '@wallet-components/CoinmarketAuthentication';
import { useCoinmarketNavigation } from '@wallet-hooks/useCoinmarketNavigation';
import type { AppState } from '@suite-types';
import invityAPI from '@suite-services/invityAPI';

interface CoinmarketSavingsLoginLoadedProps {
    selectedAccount: Extract<AppState['wallet']['selectedAccount'], { status: 'loaded' }>;
}

const CoinmarketSavingsLoginLoaded = ({ selectedAccount }: CoinmarketSavingsLoginLoadedProps) => {
    const { whoAmI, fetching } = useContext(CoinmarketAuthenticationContext);
    const { navigateToSavings } = useCoinmarketNavigation(selectedAccount.account);

    useEffect(() => {
        if (!fetching && whoAmI?.verified) {
            navigateToSavings();
        }
    }, [fetching, navigateToSavings, whoAmI?.verified]);
    return (
        <CoinmarketLayout>
            <iframe
                title="login"
                frameBorder="0"
                src={invityAPI.getLoginPageSrc()}
                sandbox="allow-scripts allow-forms allow-same-origin"
            />
            <iframe
                title="registration"
                frameBorder="0"
                src={invityAPI.getRegistrationPageSrc()}
                sandbox="allow-scripts allow-forms allow-same-origin"
            />
        </CoinmarketLayout>
    );
};

const CoinmarketSavingsLogin = () => {
    const props = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
    }));

    const { selectedAccount } = props;
    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_SAVINGS" account={selectedAccount} />;
    }
    return (
        <CoinmarketAuthentication checkWhoAmImmediately={false}>
            <CoinmarketSavingsLoginLoaded selectedAccount={selectedAccount} />
        </CoinmarketAuthentication>
    );
};

export default CoinmarketSavingsLogin;
