import React, { useState } from 'react';
import { WalletLayout } from '@wallet-components';
import { AppState } from '@suite-types';
import { EthereumStake } from './EthereumStake';
import { EthereumRequestWithdraw } from './EthereumRequestWithdraw';
import { EthereumClaim } from './EthereumClaim';
import { useDeviceModel } from '@suite-hooks';
import { DeviceModel } from '@trezor/device-utils';
import { EthereumStakeForm } from './EthereumStakeForm';

interface EthereumStakingDashboardProps {
    selectedAccount: Extract<AppState['wallet']['selectedAccount'], { status: 'loaded' }>;
}

export const EthereumStakingDashboard = ({ selectedAccount }: EthereumStakingDashboardProps) => {
    const deviceModel = useDeviceModel() as Exclude<DeviceModel, DeviceModel.UNKNOWN>;

    const [stakeFormState, setStakeFormState] = useState<'stake' | 'withdraw' | 'claim' | ''>('');

    if (stakeFormState) {
        return (
            <EthereumStakeForm
                selectedAccount={selectedAccount}
                onClose={() => setStakeFormState('')}
                stakeFormState={stakeFormState}
            />
        );
    }

    return (
        <WalletLayout title="TR_NAV_STAKING" account={selectedAccount} showEmptyHeaderPlaceholder>
            <EthereumStake
                selectedAccount={selectedAccount}
                deviceModel={deviceModel}
                onClick={() => setStakeFormState('stake')}
            />
            <EthereumRequestWithdraw
                selectedAccount={selectedAccount}
                deviceModel={deviceModel}
                onClick={() => setStakeFormState('withdraw')}
            />
            <EthereumClaim
                selectedAccount={selectedAccount}
                deviceModel={deviceModel}
                onClick={() => setStakeFormState('claim')}
            />
        </WalletLayout>
    );
};
