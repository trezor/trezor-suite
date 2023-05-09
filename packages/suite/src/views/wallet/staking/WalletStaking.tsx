import React from 'react';
import { Translation } from '@suite-components';
import { AccountExceptionLayout, WalletLayout } from '@wallet-components';
import { useSelector } from '@suite-hooks';
import { CardanoStakingDashboard } from './components/CardanoStakingDashboard';

export const WalletStaking = () => {
    const { selectedAccount } = useSelector(state => state.wallet);

    if (selectedAccount.status !== 'loaded') {
        return (
            <WalletLayout
                title="TR_NAV_STAKING"
                account={selectedAccount}
                showEmptyHeaderPlaceholder
            />
        );
    }

    if (selectedAccount.network.features.includes('staking')) {
        switch (selectedAccount.account.networkType) {
            case 'cardano':
                return <CardanoStakingDashboard selectedAccount={selectedAccount} />;
            // no default
        }
    }

    return (
        <WalletLayout title="TR_NAV_STAKING" account={selectedAccount} showEmptyHeaderPlaceholder>
            <AccountExceptionLayout
                title={<Translation id="TR_STAKING_IS_NOT_SUPPORTED" />}
                image="CLOUDY"
            />
        </WalletLayout>
    );
};
