import React, { useContext } from 'react';
import { useSelector } from '@suite-hooks';
import { CoinmarketLayout, WalletLayout } from '@wallet-components';
import CoinmarketAuthentication, {
    CoinmarketAuthenticationContext,
} from '@wallet-components/CoinmarketAuthentication';
import invityAPI from '@suite-services/invityAPI';
import { useCoinmarketNavigation } from '@wallet-hooks/useCoinmarketNavigation';
import type { AppState } from '@suite-types';
import { Button } from '@trezor/components';
import RegistrationSuccess from './components/Success';
import { getRoute } from '@suite-utils/router';

interface CoinmarketSavingsLoginRgistrationProps {
    selectedAccount: Extract<AppState['wallet']['selectedAccount'], { status: 'loaded' }>;
}

const CoinmarketSavingsRegistrationLoaded = ({
    selectedAccount,
}: CoinmarketSavingsLoginRgistrationProps) => {
    const { whoAmI } = useContext(CoinmarketAuthenticationContext);
    const { navigateToSavingsLogin } = useCoinmarketNavigation(selectedAccount.account);
    const afterVerificationReturnToPath = getRoute('wallet-coinmarket-savings-account-verified', {
        symbol: selectedAccount.account.symbol,
        accountIndex: selectedAccount.account.index,
        accountType: selectedAccount.account.accountType,
    });
    return (
        <CoinmarketLayout>
            <Button onClick={() => navigateToSavingsLogin()}>Navigate to Login</Button>
            {!whoAmI && (
                <iframe
                    title="registration"
                    frameBorder="0"
                    src={invityAPI.getRegistrationPageSrc(afterVerificationReturnToPath)}
                    sandbox="allow-scripts allow-forms allow-same-origin"
                />
            )}
            {whoAmI && !whoAmI.verified && <RegistrationSuccess />}
        </CoinmarketLayout>
    );
};

const CoinmarketSavingsRegistration = () => {
    const props = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
    }));

    const { selectedAccount } = props;
    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_SAVINGS" account={selectedAccount} />;
    }
    return (
        <CoinmarketAuthentication checkWhoAmImmediately={false}>
            <CoinmarketSavingsRegistrationLoaded selectedAccount={selectedAccount} />
        </CoinmarketAuthentication>
    );
};

export default CoinmarketSavingsRegistration;
