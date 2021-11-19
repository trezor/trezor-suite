import React from 'react';
import { useSelector } from '@suite-hooks';
import { CoinmarketLayout, WalletLayout } from '@wallet-components';

const CoinmarketSavingsLoaded = () => (
    <>
        <CoinmarketLayout>Savings</CoinmarketLayout>
    </>
);

const CoinmarketSavings = () => {
    const props = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
    }));

    const { selectedAccount } = props;
    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_SAVINGS" account={selectedAccount} />;
    }
    return (
        <>
            <CoinmarketSavingsLoaded />
        </>
    );
};

export default CoinmarketSavings;
