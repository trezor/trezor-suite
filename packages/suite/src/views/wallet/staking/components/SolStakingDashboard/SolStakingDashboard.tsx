import { SOLANA_EPOCH_DAYS } from '@suite-common/wallet-constants';
import {
    selectAccountIsStakingActive,
    selectHasRunningDiscovery,
    selectPoolStatsApyData,
} from '@suite-common/wallet-core';
import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { getStakingDataForNetwork } from '@suite-common/wallet-utils';
import { Column, Flex, Grid } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { DashboardSection } from 'src/components/dashboard';
import { useDevice, useLayoutSize, useSelector } from 'src/hooks/suite';
import { useSolanaRewards } from 'src/hooks/wallet/useSolanaRewards';
import { ConnectDeviceGenericPromo } from 'src/views/wallet/receive/components/ConnectDevicePromo';

import { StakingDashboard } from '../StakingDashboard/StakingDashboard';
import { RewardsList } from './Rewards/RewardsList';
import { StakingRewardsWarning } from './StakingRewardsWarning';
import { useRewardsNotAvailableYet } from './hooks/useRewardsNotAvailableYet';
import { ApyCard } from '../StakingDashboard/components/ApyCard';
import { ClaimCard } from '../StakingDashboard/components/ClaimCard';
import { DiscoveryWarning } from '../StakingDashboard/components/DiscoveryWarning';
import { EmptyStakingCard } from '../StakingDashboard/components/EmptyStakingCard';
import { PayoutCardFrequencyRewards } from '../StakingDashboard/components/PayoutCardFrequencyRewards';
import { StakingCard } from '../StakingDashboard/components/StakingCard';

interface SolStakingDashboardProps {
    selectedAccount: SelectedAccountLoaded;
}

export const SolStakingDashboard = ({ selectedAccount }: SolStakingDashboardProps) => {
    const { account } = selectedAccount;
    const { device } = useDevice();

    const { isBelowLaptop } = useLayoutSize();
    const isDeviceConnected = device?.connected && device?.available;
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const { canClaim = false } = getStakingDataForNetwork(account) ?? {};

    const apy = useSelector(state => selectPoolStatsApyData(state, account));

    const isStakingActive = useSelector(state => selectAccountIsStakingActive(state, account.key));

    const rewards = useSolanaRewards(account);
    const rewardsNotAvailableYet = useRewardsNotAvailableYet(
        account,
        rewards.selectedAccountRewards?.[0],
    );

    return (
        <StakingDashboard
            selectedAccount={selectedAccount}
            dashboard={
                <Column alignItems="normal" gap={spacings.xxxxl}>
                    {isStakingActive ? (
                        <>
                            <DashboardSection>
                                <Column alignItems="normal" gap={spacings.sm}>
                                    {!isDeviceConnected && <ConnectDeviceGenericPromo />}
                                    {isDiscoveryRunning && <DiscoveryWarning />}
                                    {rewardsNotAvailableYet && <StakingRewardsWarning />}

                                    <Grid
                                        columns={isBelowLaptop || !canClaim ? 1 : 2}
                                        gap={spacings.sm}
                                    >
                                        <ClaimCard />
                                        <Flex
                                            direction={canClaim ? 'column' : 'row'}
                                            gap={spacings.sm}
                                        >
                                            <ApyCard apy={apy} />
                                            <PayoutCardFrequencyRewards
                                                rewardFrequency={SOLANA_EPOCH_DAYS}
                                            />
                                        </Flex>
                                    </Grid>
                                    <StakingCard
                                        isValidatorsQueueLoading={undefined}
                                        daysToAddToPool={SOLANA_EPOCH_DAYS}
                                        daysToUnstake={SOLANA_EPOCH_DAYS}
                                    />
                                </Column>
                            </DashboardSection>
                            <RewardsList account={account} rewards={rewards} />
                        </>
                    ) : (
                        <EmptyStakingCard />
                    )}
                </Column>
            }
        />
    );
};
