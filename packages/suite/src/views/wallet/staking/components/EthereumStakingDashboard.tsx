import React from 'react';
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

    const [stakeForm, setStakeForm] = React.useState(false);

    if (stakeForm) {
        return (
            <EthereumStakeForm
                selectedAccount={selectedAccount}
                onClose={() => setStakeForm(false)}
            />
        );
    }

    return (
        <WalletLayout title="TR_NAV_STAKING" account={selectedAccount} showEmptyHeaderPlaceholder>
            <EthereumStake
                selectedAccount={selectedAccount}
                deviceModel={deviceModel}
                onClick={() => setStakeForm(true)}
            />
            <EthereumRequestWithdraw selectedAccount={selectedAccount} deviceModel={deviceModel} />
            <EthereumClaim selectedAccount={selectedAccount} deviceModel={deviceModel} />
        </WalletLayout>
    );
};
