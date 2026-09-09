import { useEffect } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';
import {
    CARDANO_EPOCH_DAYS,
    fetchAllTransactionsForAccountThunk,
    hasPendingStakeTypeTransaction,
    isCardanoStakedWithEverstake,
    selectAccountIsStakingActive,
    selectCardanoPoolsInfo,
    selectHasRunningDiscovery,
    selectPoolStatsApy,
} from '@suite-common/wallet-core';
import { type SelectedAccountLoaded } from '@suite-common/wallet-types';
import { Column, Flex } from '@trezor/components';

import { DashboardSection } from 'src/components/dashboard';
import { useSelector } from 'src/hooks/suite';

import { CardanoNewProviderCard } from './CardanoNewProviderCard';
import { StakingDashboard } from '../StakingDashboard/StakingDashboard';
import { ApyCard } from '../StakingDashboard/components/ApyCard';
import { DebugOnlyCardanoStakingCard } from '../StakingDashboard/components/DebugOnlyCardanoStakingCard';
import { DiscoveryWarning } from '../StakingDashboard/components/DiscoveryWarning';
import { EmptyStakingCard } from '../StakingDashboard/components/EmptyStakingCard/EmptyStakingCard';
import { PayoutCardFrequencyRewards } from '../StakingDashboard/components/PayoutCardFrequencyRewards';
import { StakingCard } from '../StakingDashboard/components/StakingCard';
import { Transactions } from '../StakingDashboard/components/Transactions';

interface AdaStakingDashboardProps {
    selectedAccount: SelectedAccountLoaded;
}

export const AdaStakingDashboard = ({ selectedAccount }: AdaStakingDashboardProps) => {
    const { account } = selectedAccount;
    const accountKey = account?.key ?? '';

    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const { dispatch } = useServices(selectDispatch);

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
                <Column alignItems="normal" gap={48}>
                    {shouldShowStakingDashboard ? (
                        <DashboardSection>
                            <Column alignItems="normal" gap={12}>
                                {isDiscoveryRunning && <DiscoveryWarning />}

                                <CardanoNewProviderCard account={account} />

                                <Flex gap={12}>
                                    <ApyCard apy={isStakedWithEverstake ? apy : undefined} />
                                    <PayoutCardFrequencyRewards
                                        rewardFrequency={CARDANO_EPOCH_DAYS}
                                    />
                                </Flex>
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
