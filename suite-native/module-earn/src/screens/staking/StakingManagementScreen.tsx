import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { useRefreshStakingProductInfo } from '@suite-common/earn-staking';
import { getNetworkType } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    fetchAllTransactionsForAccountThunk,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { parseAccountKey } from '@suite-common/wallet-utils';
import { type RootStackParamList, type RootStackRoutes, Screen } from '@suite-native/navigation';
import { TransactionList } from '@suite-native/transactions';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { EarnPortfolioTrackerGuard } from '../../components/earn/EarnPortfolioTrackerGuard';
import { SolanaStakingRewardsList } from '../../components/staking/SolanaStakingRewardsList';
import { StakingManagementListHeader } from '../../components/staking/StakingManagementListHeader';
import { StakingManagementScreenHeader } from '../../components/staking/StakingManagementScreenHeader';

export const StakingManagementScreen = () => {
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.StakingManagement>>();
    const { accountKey } = route.params;
    const { networkSymbol } = parseAccountKey(accountKey);
    const { dispatch } = useServices(injectDispatch);

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    // Solana shows a rewards list, other networks keep the transaction history.
    const isSolanaStaking = getNetworkType(networkSymbol) === 'solana';

    useEffect(() => {
        dispatch(fetchAllTransactionsForAccountThunk({ accountKey, noLoading: true }));
    }, [accountKey, dispatch]);

    const refreshProductInfo = useRefreshStakingProductInfo();
    // A pull asks for fresh data even within the maximum age, as the legacy fetch did.
    const refreshProductInfoNow = () => refreshProductInfo({ force: true });

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
                            onRefresh={refreshProductInfoNow}
                        />
                    ) : (
                        <TransactionList
                            account={account}
                            onRefresh={refreshProductInfoNow}
                            listHeaderComponent={listHeaderComponent}
                            filter={{ type: 'staking' }}
                        />
                    ))}
            </Screen>
        </EarnPortfolioTrackerGuard>
    );
};
