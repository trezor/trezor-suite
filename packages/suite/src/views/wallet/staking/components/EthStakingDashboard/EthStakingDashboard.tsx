import { useEffect } from 'react';

import { useStakingActivationDays } from '@suite-common/earn';
import {
    selectIsStakingAccountActive,
    useNetworkStakingRate,
    useStakingAccountPosition,
    useStakingDaysUntil,
    useStakingPeriods,
} from '@suite-common/earn-staking';
import {
    fetchAllTransactionsForAccountThunk,
    selectHasRunningDiscovery,
} from '@suite-common/wallet-core';
import { type SelectedAccountLoaded } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { Column, Flex, Grid } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { DashboardSection } from '#src/components/dashboard/DashboardSection';
import { useLayoutSize } from '#src/hooks/suite/useLayoutSize';
import { useSelector } from '#src/hooks/suite/useSelector';

import { InstantStakeBanner } from './InstantStakeBanner';
import { selectAccountInstantStakeTransactions } from './ethStakingDashboardSelectors';
import { StakingDashboard } from '../StakingDashboard/StakingDashboard';
import { ApyCard } from '../StakingDashboard/components/ApyCard';
import { ClaimCard } from '../StakingDashboard/components/ClaimCard';
import { DiscoveryWarning } from '../StakingDashboard/components/DiscoveryWarning';
import { EmptyStakingCard } from '../StakingDashboard/components/EmptyStakingCard/EmptyStakingCard';
import { PayoutCardNextRewards } from '../StakingDashboard/components/PayoutCardNextRewards';
import { StakingCard } from '../StakingDashboard/components/StakingCard';
import { Transactions } from '../StakingDashboard/components/Transactions';

interface EthStakingDashboardProps {
    selectedAccount: SelectedAccountLoaded;
}

export const EthStakingDashboard = ({ selectedAccount }: EthStakingDashboardProps) => {
    const { account } = selectedAccount;

    const accountKey = account.key;
    const { isBelowLaptop } = useLayoutSize();
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const { productId, position, totals } = useStakingAccountPosition(accountKey);
    const { rate } = useNetworkStakingRate({ networkSymbol: account.symbol, accountKey });
    const { entryPeriodDays, exitPeriodDays } = useStakingPeriods(productId);

    // A deposit is dated from the queue at its stake time and an unlock by the position; without
    // one, the periods estimate.
    const daysUntilActivation = useStakingActivationDays(accountKey);
    const daysUntilUnlock = useStakingDaysUntil(position?.unlocks[0]?.availableAt ?? null);
    const daysToAddToPool = daysUntilActivation ?? entryPeriodDays;
    const daysToUnstake = daysUntilUnlock ?? exitPeriodDays;

    const txs = useSelector(state => selectAccountInstantStakeTransactions(state, accountKey));

    const { dispatch } = useServices(injectDispatch);

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

    const canClaim = isPositiveBalance(totals.withdrawable);

    const isStakingActive = useSelector(state => selectIsStakingAccountActive(state, accountKey));

    return (
        <StakingDashboard
            selectedAccount={selectedAccount}
            dashboard={
                <Column gap={48}>
                    {isStakingActive ? (
                        <DashboardSection>
                            <Column gap={12}>
                                {isDiscoveryRunning && <DiscoveryWarning />}

                                <InstantStakeBanner
                                    account={account}
                                    txs={txs}
                                    daysToAddToPool={daysToAddToPool}
                                    daysToUnstake={daysToUnstake}
                                />

                                <Grid columns={isBelowLaptop || !canClaim ? 1 : 2} gap={12}>
                                    <ClaimCard account={account} />

                                    <Flex direction={canClaim ? 'column' : 'row'} gap={12}>
                                        <ApyCard networkSymbol={account.symbol} apy={rate} />

                                        <PayoutCardNextRewards account={account} />
                                    </Flex>
                                </Grid>

                                <StakingCard
                                    account={account}
                                    daysToAddToPool={daysToAddToPool}
                                    daysToUnstake={daysToUnstake}
                                />
                            </Column>
                        </DashboardSection>
                    ) : (
                        <EmptyStakingCard account={account} />
                    )}

                    <Transactions account={account} />
                </Column>
            }
        />
    );
};
