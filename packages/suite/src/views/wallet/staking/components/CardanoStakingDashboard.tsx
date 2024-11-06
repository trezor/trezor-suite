import type { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { DeviceModelInternal } from '@trezor/connect';

import { WalletLayout } from 'src/components/wallet';
import { useCardanoStaking } from 'src/hooks/wallet/useCardanoStaking';
import { useDevice } from 'src/hooks/suite';

import { CardanoRewards } from './CardanoRewards';
import { CardanoStake } from './CardanoStake';
import { CardanoRedelegate } from './CardanoRedelegate';


interface CardanoStakingDashboardProps {
    selectedAccount: SelectedAccountLoaded;
}

export const CardanoStakingDashboard = ({ selectedAccount }: CardanoStakingDashboardProps) => {
    const { isActive, isStakingOnTrezorPool, isCurrentPoolOversaturated } = useCardanoStaking();
    const { device } = useDevice();

    if (!device?.features) {
        return null;
    }

    // T1B1 does not have Capability_Cardano
    const deviceModel = device.features.internal_model as Exclude<
        DeviceModelInternal,
        DeviceModelInternal.T1B1
    >;

    return (
        <WalletLayout title="TR_NAV_STAKING" account={selectedAccount} showEmptyHeaderPlaceholder>
            <>
                {isActive && (
                    <CardanoRewards account={selectedAccount.account} deviceModel={deviceModel} />
                )}
                {!isActive && (
                    <CardanoStake account={selectedAccount.account} deviceModel={deviceModel} />
                )}
                {isActive && (isStakingOnTrezorPool === false || isCurrentPoolOversaturated) && (
                    <CardanoRedelegate deviceModel={deviceModel} />
                )}
            </>
        </WalletLayout>
    );
};
