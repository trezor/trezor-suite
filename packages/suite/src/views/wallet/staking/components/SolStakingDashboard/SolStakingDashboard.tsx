import { SOLANA_EPOCH_DAYS } from '@suite-common/wallet-constants';
import {
    selectAccountIsStakingActive,
    selectHasRunningDiscovery,
    selectHasSolExternalStakingAccounts,
    selectPoolStatsApyData,
    selectSolExternalStakingAccountsTotalStaked,
} from '@suite-common/wallet-core';
import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { getStakingDataForNetwork } from '@suite-common/wallet-utils';
import { Column, Flex, Grid } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { DashboardSection } from 'src/components/dashboard';
import { useLayoutSize, useSelector } from 'src/hooks/suite';
import { useSolanaRewards } from 'src/hooks/wallet/useSolanaRewards';

import { StakingDashboard } from '../StakingDashboard/StakingDashboard';
import { RewardsList } from './Rewards/RewardsList';
import { StakingRewardsWarning } from './StakingRewardsWarning';
import { useRewardsNotAvailableYet } from './hooks/useRewardsNotAvailableYet';
import { ApyCard } from '../StakingDashboard/components/ApyCard';
import { ClaimCard } from '../StakingDashboard/components/ClaimCard';
import { DiscoveryWarning } from '../StakingDashboard/components/DiscoveryWarning';
import { EmptyStakingCard } from '../StakingDashboard/components/EmptyStakingCard';
import { ExternalStakingProviderCard } from '../StakingDashboard/components/ExternalStakingProviderCard';
import { PayoutCardFrequencyRewards } from '../StakingDashboard/components/PayoutCardFrequencyRewards';
import { StakingCard } from '../StakingDashboard/components/StakingCard';
interface SolStakingDashboardProps {
    selectedAccount: SelectedAccountLoaded;
}

export const SolStakingDashboard = ({ selectedAccount }: SolStakingDashboardProps) => {
    const { account } = selectedAccount;

    const { isBelowLaptop } = useLayoutSize();
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const { canClaim = false } = getStakingDataForNetwork(account) ?? {};

    const apy = useSelector(state => selectPoolStatsApyData(state, account));

    const isStakingActive = useSelector(state => selectAccountIsStakingActive(state, account.key));

    const rewards = useSolanaRewards(account);
    const rewardsNotAvailableYet = useRewardsNotAvailableYet(
        account,
        rewards.selectedAccountRewards?.[0],
    );

    const hasExternalStakingAccounts = useSelector(state =>
        selectHasSolExternalStakingAccounts(state, account.key),
    );
    const externalStakingTotalStaked = useSelector(state =>
        selectSolExternalStakingAccountsTotalStaked(state, account.key),
    );

    return (
        <StakingDashboard
            selectedAccount={selectedAccount}
            dashboard={
                <Column alignItems="normal" gap={spacings.xxxxl}>
                    {hasExternalStakingAccounts && (
                        <ExternalStakingProviderCard
                            symbol={account.symbol}
                            totalStaked={externalStakingTotalStaked}
                        />
                    )}
                    {isStakingActive ? (
                        <>
                            <DashboardSection>
                                <Column alignItems="normal" gap={spacings.sm}>
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
                                        account={account}
                                        isValidatorsQueueLoading={undefined}
                                        daysToAddToPool={SOLANA_EPOCH_DAYS}
                                        daysToUnstake={SOLANA_EPOCH_DAYS}
                                    />
                                </Column>
                            </DashboardSection>
                            <RewardsList account={account} rewards={rewards} />
                        </>
                    ) : (
                        <>
                            <EmptyStakingCard />
                        </>
                    )}
                </Column>
            }
        />
    );
};
