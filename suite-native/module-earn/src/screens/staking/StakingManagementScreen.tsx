import { useEffect, useMemo } from 'react';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { useDispatch } from '@suite-common/redux-utils';
import {
    type AccountsRootState,
    fetchAllTransactionsForAccountThunk,
    initStakeDataThunk,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { isSupportedSolStakingNetworkSymbol, parseAccountKey } from '@suite-common/wallet-utils';
import { type RootStackParamList, type RootStackRoutes, Screen } from '@suite-native/navigation';
import { useSelector } from '@suite-native/staking';
import { TransactionList } from '@suite-native/transactions';

import { EarnPortfolioTrackerGuard } from '../../components/earn/EarnPortfolioTrackerGuard';
import { SolanaStakingRewardsList } from '../../components/staking/SolanaStakingRewardsList';
import { StakingManagementListHeader } from '../../components/staking/StakingManagementListHeader';
import { StakingManagementScreenHeader } from '../../components/staking/StakingManagementScreenHeader';

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

    // Screen mounts are the only stake-data refresh path after app init.
    useEffect(() => {
        dispatch(initStakeDataThunk());
    }, [dispatch]);

    const listHeaderComponent = useMemo(
        () => <StakingManagementListHeader accountKey={accountKey} />,
        [accountKey],
    );

    return (
        <EarnPortfolioTrackerGuard>
            <Screen
                header={<StakingManagementScreenHeader />}
                noHorizontalPadding
                noBottomPadding
                hasBottomInset={false}
                /** Adding scrollable wraps content in ScrollView which is unwanted for this screen because list component already adds the scrollview **/
                isScrollable={false}
            >
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
                            filter="staking"
                        />
                    ))}
            </Screen>
        </EarnPortfolioTrackerGuard>
    );
};
