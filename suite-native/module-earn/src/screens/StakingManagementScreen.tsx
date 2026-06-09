import { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { Context } from '@suite-common/message-system';
import {
    type AccountsRootState,
    fetchAllTransactionsForAccountThunk,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import {
    isStakingSymbol,
    isSupportedEthStakingNetworkSymbol,
    isSupportedSolStakingNetworkSymbol,
    parseAccountKey,
} from '@suite-common/wallet-utils';
import { Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { ContextMessage } from '@suite-native/message-system';
import { type RootStackParamList, type RootStackRoutes, Screen } from '@suite-native/navigation';
import { useSelector } from '@suite-native/staking';
import { TransactionList } from '@suite-native/transactions';

import { EarnPortfolioTrackerGuard } from '../components/EarnPortfolioTrackerGuard';
import { InstantUnstakeConfirmationBanner } from '../components/InstantUnstakeConfirmationBanner';
import { SolExternalStakingBanner } from '../components/SolExternalStakingBanner';
import { SolStakingRewardsWarning } from '../components/SolStakingRewardsWarning';
import { SolanaStakingRewardsList } from '../components/SolanaStakingRewardsList';
import { StakingManagementPendingSection } from '../components/StakingManagementPendingSection';
import { StakingManagementScreenHeader } from '../components/StakingManagementScreenHeader';
import { StakingManagementStakedCard } from '../components/StakingManagementStakedCard';

export const StakingManagementScreen = () => {
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.StakingManagement>>();
    const { accountKey } = route.params;
    const { networkSymbol } = parseAccountKey(accountKey);
    const dispatch = useDispatch();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    // Solana shows a rewards list, other networks keep the transaction history.
    const isSolanaStaking = isSupportedSolStakingNetworkSymbol(networkSymbol);

    useEffect(() => {
        dispatch(fetchAllTransactionsForAccountThunk({ accountKey, noLoading: true }));
    }, [accountKey, dispatch]);

    const listHeaderComponent = useMemo(
        () => (
            <VStack spacing="sp48" marginTop="sp32" paddingHorizontal="sp16">
                {isSupportedEthStakingNetworkSymbol(networkSymbol) && (
                    <InstantUnstakeConfirmationBanner accountKey={accountKey} />
                )}
                {isStakingSymbol(networkSymbol) && (
                    <ContextMessage context={Context.getStaking(networkSymbol)} />
                )}
                <StakingManagementPendingSection accountKey={accountKey} />
                {isSolanaStaking && <SolStakingRewardsWarning accountKey={accountKey} />}
                <VStack spacing="sp16">
                    <Text variant="headline-sm">
                        <Translation id="earn.stakingManagementScreen.yourStake" />
                    </Text>
                    <StakingManagementStakedCard
                        accountKey={accountKey}
                        networkSymbol={networkSymbol}
                    />
                    {isSolanaStaking && (
                        <SolExternalStakingBanner
                            accountKey={accountKey}
                            networkSymbol={networkSymbol}
                        />
                    )}
                </VStack>
                <Text variant="headline-sm">
                    <Translation
                        id={
                            isSolanaStaking
                                ? 'earn.stakingManagementScreen.rewardsList.title'
                                : 'earn.stakingManagementScreen.stakingHistory'
                        }
                    />
                </Text>
            </VStack>
        ),
        [accountKey, isSolanaStaking, networkSymbol],
    );

    return (
        <EarnPortfolioTrackerGuard>
            <Screen header={<StakingManagementScreenHeader />} noHorizontalPadding>
                {account &&
                    (isSolanaStaking ? (
                        <SolanaStakingRewardsList
                            account={account}
                            listHeaderComponent={listHeaderComponent}
                        />
                    ) : (
                        <TransactionList
                            account={account}
                            listHeaderComponent={listHeaderComponent}
                            stakingOnly
                        />
                    ))}
            </Screen>
        </EarnPortfolioTrackerGuard>
    );
};
