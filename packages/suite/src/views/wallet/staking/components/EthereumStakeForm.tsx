import React from 'react';
import { AppState } from '@suite-types';
import { Card } from '@trezor/components';
import { WalletLayout, WalletLayoutHeader } from '@wallet-components';

interface EthereumStakeFormProps {
    selectedAccount: Extract<AppState['wallet']['selectedAccount'], { status: 'loaded' }>;
}

export const EthereumStakeForm = ({ selectedAccount }: EthereumStakeFormProps) => {
    // @ts-expect-error
    const a = 'test';

    return (
        <WalletLayout title="TR_NAV_STAKING" account={selectedAccount}>
            <WalletLayoutHeader title="TR_NAV_STAKING" routeName="wallet-staking" />
            <Card>cau</Card>
        </WalletLayout>
    );
};
