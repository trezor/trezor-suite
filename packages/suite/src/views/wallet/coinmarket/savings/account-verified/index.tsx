import React from 'react';
import { useSelector } from '@suite-hooks';
import { CoinmarketLayout, WalletLayout } from '@wallet-components';
import { useCoinmarketNavigation } from '@wallet-hooks/useCoinmarketNavigation';
import type { AppState } from '@suite-types';
import { Button } from '@trezor/components';

interface CoinmarketSavingsLoginRgistrationProps {
    selectedAccount: Extract<AppState['wallet']['selectedAccount'], { status: 'loaded' }>;
}

const CoinmarketSavingsAccountVerifiedLoaded = ({
    selectedAccount,
}: CoinmarketSavingsLoginRgistrationProps) => {
    const { navigateToSavingsLogin } = useCoinmarketNavigation(selectedAccount.account);
    return (
        <CoinmarketLayout>
            Your account has been verified.
            <Button onClick={() => navigateToSavingsLogin()}>Navigate to Login</Button>
        </CoinmarketLayout>
    );
};

const CoinmarketSavingsAccountVerified = () => {
    const props = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
    }));

    const { selectedAccount } = props;
    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_SAVINGS" account={selectedAccount} />;
    }
    return <CoinmarketSavingsAccountVerifiedLoaded selectedAccount={selectedAccount} />;
};

export default CoinmarketSavingsAccountVerified;
