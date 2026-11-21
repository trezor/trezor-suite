import { useEffect } from 'react';

import {
    selectHasStakingAccountWarning,
    selectIsStakingAccountActive,
    selectIsStakingAccountDelegatedOutside,
    useNetworkStakingRate,
    useStakingAccountPosition,
    useStakingPeriods,
} from '@suite-common/earn-staking';
import { hasPendingStakingOperation } from '@suite-common/earn-staking-common';
import {
    fetchAllTransactionsForAccountThunk,
    selectHasRunningDiscovery,
} from '@suite-common/wallet-core';
import { type SelectedAccountLoaded } from '@suite-common/wallet-types';
import { Column, Flex } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { DashboardSection } from '#src/components/dashboard/DashboardSection';
import { useSelector } from '#src/hooks/suite/useSelector';

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
    const accountKey = account.key;

    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

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

    const { productId, position } = useStakingAccountPosition(accountKey);
    const { rate } = useNetworkStakingRate({ networkSymbol: account.symbol, accountKey });
    const { rewardPeriodDays } = useStakingPeriods(productId);

    const isStakingActive = useSelector(state => selectIsStakingAccountActive(state, accountKey));

    const isDelegatedOutside = useSelector(state =>
        selectIsStakingAccountDelegatedOutside(state, accountKey),
    );
    // A retired provider pays nothing, which reads as a zero rate, as on mobile.
    const hasOutdatedProvider = useSelector(state =>
        selectHasStakingAccountWarning(state, accountKey, 'outdated-provider'),
    );
    const hasPendingOperation = position !== null && hasPendingStakingOperation(position);

    // The rate belongs to a delegation Suite offers; a registered key without a pool has none to
    // show until a transaction that may delegate it is pending.
    const isStakedWithProvider =
        position !== null && position.targets.length > 0 && !isDelegatedOutside;
    const shownRate = isStakedWithProvider || hasPendingOperation ? rate : null;

    const shouldShowStakingDashboard = isStakingActive || hasPendingOperation;

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
                                    <ApyCard apy={shownRate} isNotEarning={hasOutdatedProvider} />

                                    <PayoutCardFrequencyRewards
                                        rewardFrequency={rewardPeriodDays}
                                    />
                                </Flex>

                                <StakingCard account={account} />
                                <DebugOnlyCardanoStakingCard account={account} />
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
