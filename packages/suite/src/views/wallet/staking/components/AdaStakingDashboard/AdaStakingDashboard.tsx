import { useEffect } from 'react';

import { CARDANO_EPOCH_DAYS } from '@suite-common/wallet-constants';
import {
    fetchAllTransactionsForAccountThunk,
    hasPendingStakeTypeTransaction,
    selectAccountIsStakingActive,
    selectCardanoPoolsInfo,
    selectHasRunningDiscovery,
    selectPoolStatsApy,
} from '@suite-common/wallet-core';
import { type SelectedAccountLoaded } from '@suite-common/wallet-types';
import { getStakingDataForNetwork, isCardanoStakedWithEverstake } from '@suite-common/wallet-utils';
import { Column, Flex, Grid } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { DashboardSection } from 'src/components/dashboard';
import { useDispatch, useLayoutSize, useSelector } from 'src/hooks/suite';

import { CardanoNewProviderCard } from './CardanoNewProviderCard';
import { StakingDashboard } from '../StakingDashboard/StakingDashboard';
import { ApyCard } from '../StakingDashboard/components/ApyCard';
import { ClaimCard } from '../StakingDashboard/components/ClaimCard';
import { DebugOnlyCardanoStakingCard } from '../StakingDashboard/components/DebugOnlyCardanoStakingCard';
import { DiscoveryWarning } from '../StakingDashboard/components/DiscoveryWarning';
import { EmptyStakingCard } from '../StakingDashboard/components/EmptyStakingCard';
import { PayoutCardFrequencyRewards } from '../StakingDashboard/components/PayoutCardFrequencyRewards';
import { StakingCard } from '../StakingDashboard/components/StakingCard';
import { Transactions } from '../StakingDashboard/components/Transactions';

interface AdaStakingDashboardProps {
    selectedAccount: SelectedAccountLoaded;
}

export const AdaStakingDashboard = ({ selectedAccount }: AdaStakingDashboardProps) => {
    const { account } = selectedAccount;
    const accountKey = account?.key ?? '';

    const { isBelowLaptop } = useLayoutSize();
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const dispatch = useDispatch();

    useEffect(() => {
        if (accountKey) {
            dispatch(
                fetchAllTransactionsForAccountThunk({
                    accountKey,
                    noLoading: true,
                }),
            );
        }
    }, [accountKey, dispatch]);

    const { canClaim = false } = getStakingDataForNetwork(account) ?? {};

    const apy = useSelector(state => selectPoolStatsApy(state, { account }));

    const isStakingActive = useSelector(state => selectAccountIsStakingActive(state, account.key));
    const hasPendingTx = useSelector(state => hasPendingStakeTypeTransaction(state, account.key));
    const cardanoStakingPools = useSelector(selectCardanoPoolsInfo);
    const isStakedWithEverstake =
        isCardanoStakedWithEverstake(account, cardanoStakingPools) || hasPendingTx;

    const shouldShowStakingDashboard = isStakingActive || hasPendingTx;

    return (
        <StakingDashboard
            selectedAccount={selectedAccount}
            dashboard={
                <Column alignItems="normal" gap={spacings.xxxxl}>
                    {shouldShowStakingDashboard ? (
                        <DashboardSection>
                            <Column alignItems="normal" gap={spacings.sm}>
                                {isDiscoveryRunning && <DiscoveryWarning />}

                                <CardanoNewProviderCard account={account} />

                                <Grid
                                    columns={isBelowLaptop || !canClaim ? 1 : 2}
                                    gap={spacings.sm}
                                >
                                    <ClaimCard />
                                    <Flex direction={canClaim ? 'column' : 'row'} gap={spacings.sm}>
                                        <ApyCard apy={isStakedWithEverstake ? apy : undefined} />
                                        <PayoutCardFrequencyRewards
                                            rewardFrequency={CARDANO_EPOCH_DAYS}
                                        />
                                    </Flex>
                                </Grid>
                                <StakingCard
                                    account={account}
                                    isValidatorsQueueLoading={undefined}
                                    daysToAddToPool={CARDANO_EPOCH_DAYS}
                                    daysToUnstake={CARDANO_EPOCH_DAYS}
                                />
                                <DebugOnlyCardanoStakingCard account={account} />
                            </Column>
                        </DashboardSection>
                    ) : (
                        <EmptyStakingCard />
                    )}
                    <Transactions />
                </Column>
            }
        />
    );
};
