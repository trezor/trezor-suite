import { useCallback, useEffect, useMemo } from 'react';
import { type EdgeInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import {
    type AccountsRootState,
    fetchAllTransactionsForAccountThunk,
    initStakeDataThunk,
    isSupportedSolStakingNetworkSymbol,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { parseAccountKey } from '@suite-common/wallet-utils';
import { Box, useBannerAwareSafeAreaInsets } from '@suite-native/atoms';
import { type RootStackParamList, type RootStackRoutes, Screen } from '@suite-native/navigation';
import { TransactionList } from '@suite-native/transactions';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { EarnPortfolioTrackerGuard } from '../../components/earn/EarnPortfolioTrackerGuard';
import { SolanaStakingRewardsList } from '../../components/staking/SolanaStakingRewardsList';
import { StakingManagementListHeader } from '../../components/staking/StakingManagementListHeader';
import { StakingManagementScreenHeader } from '../../components/staking/StakingManagementScreenHeader';

const listContainerStyle = prepareNativeStyle<{ insets: EdgeInsets }>((utils, { insets }) => ({
    flex: 1,
    // List rows and the list header already provide 16 px of page spacing.
    marginLeft: -Math.min(insets.left, utils.spacings.sp16),
    marginRight: -Math.min(insets.right, utils.spacings.sp16),
}));

export const StakingManagementScreen = () => {
    const insets = useBannerAwareSafeAreaInsets();
    const { applyStyle } = useNativeStyles();
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.StakingManagement>>();
    const { accountKey } = route.params;
    const { networkSymbol } = parseAccountKey(accountKey);
    const { dispatch } = useServices(injectDispatch);

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    // Solana shows a rewards list, other networks keep the transaction history.
    const isSolanaStaking = isSupportedSolStakingNetworkSymbol(networkSymbol);

    useEffect(() => {
        dispatch(fetchAllTransactionsForAccountThunk({ accountKey, noLoading: true }));
    }, [accountKey, dispatch]);

    const refreshStakeData = useCallback(() => dispatch(initStakeDataThunk()), [dispatch]);

    // Screen mounts and pull-to-refresh are the only stake-data refresh paths after app init.
    useEffect(() => {
        refreshStakeData();
    }, [refreshStakeData]);

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
                <Box style={applyStyle(listContainerStyle, { insets })}>
                    {account &&
                        (isSolanaStaking ? (
                            <SolanaStakingRewardsList
                                account={account}
                                listHeaderComponent={listHeaderComponent}
                            />
                        ) : (
                            <TransactionList
                                account={account}
                                onRefresh={refreshStakeData}
                                listHeaderComponent={listHeaderComponent}
                                filter="staking"
                            />
                        ))}
                </Box>
            </Screen>
        </EarnPortfolioTrackerGuard>
    );
};
