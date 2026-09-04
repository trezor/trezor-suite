import { useCallback, useMemo } from 'react';
import { useStore } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { BottomSheetModal, type BottomSheetModalRef, Box } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { EarnAccountCard } from './EarnAccountCard';
import { useStakingDetailNavigation } from '../../hooks/staking/useStakingDetailNavigation';
import { useStakingNavigateAnalytics } from '../../hooks/staking/useStakingNavigateAnalytics';
import { useYieldDetailNavigation } from '../../hooks/yield/useYieldDetailNavigation';
import { type EarnDepositsCardActiveItem } from '../../types';

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.StakingManagement>;

type EarnActiveItemsBottomSheetProps = {
    ref: BottomSheetModalRef;
    type: EarnDepositsCardActiveItem['type'];
    items: EarnDepositsCardActiveItem[];
    onClose: () => void;
};

export const EarnActiveItemsBottomSheet = ({
    ref,
    type,
    items,
    onClose,
}: EarnActiveItemsBottomSheetProps) => {
    const navigation = useNavigation<NavigationProp>();
    const reportStakingNavigate = useStakingNavigateAnalytics();
    const store = useStore<AccountsRootState>();
    const { analytics } = useServices(selectNativeAnalyticsDep);

    const { navigateToStakingDetail } = useStakingDetailNavigation();
    const { navigateToYieldDetail } = useYieldDetailNavigation();

    const title = useMemo(
        () =>
            type === 'staking' ? (
                <Translation id="earn.earnScreen.activeSheet.stakingPositionsTitle" />
            ) : (
                <Translation id="earn.earnScreen.activeSheet.yieldPositionsTitle" />
            ),
        [type],
    );

    const handlePress = useCallback(
        (item: EarnDepositsCardActiveItem) => {
            onClose();

            switch (item.type) {
                case 'staking': {
                    const account = selectAccountByKey(store.getState(), item.accountKey);
                    if (account) {
                        reportStakingNavigate(account);
                    }
                    navigateToStakingDetail({
                        accountKey: item.accountKey,
                        symbol: asNetworkSymbol(item.symbol),
                    });
                    break;
                }
                case 'stablecoin-yield': {
                    analytics.report({
                        type: events.yieldNavigateEvent.name,
                        payload: {
                            from: 'earn-dashboard',
                            to: 'vault-detail',
                            networkSymbol: item.networkSymbol,
                            action: 'continue',
                        },
                    });

                    navigateToYieldDetail({
                        accountKey: item.accountKey,
                        tokenContract: item.contractAddress,
                    });
                    break;
                }
            }
        },
        [
            navigateToStakingDetail,
            navigateToYieldDetail,
            analytics,
            onClose,
            reportStakingNavigate,
            store,
        ],
    );

    const handleClaimPress = useCallback(
        (item: EarnDepositsCardActiveItem) => {
            if (item.type !== 'staking') return;

            onClose();

            navigation.navigate(RootStackRoutes.StakingClaimReview, {
                accountKey: item.accountKey,
                symbol: asNetworkSymbol(item.symbol),
            });
        },
        [navigation, onClose],
    );

    const renderItem = useCallback(
        ({ item }: { item: EarnDepositsCardActiveItem }) => (
            <EarnAccountCard
                item={item}
                onPress={() => handlePress(item)}
                onClaimPress={() => handleClaimPress(item)}
            />
        ),
        [handlePress, handleClaimPress],
    );

    return (
        <BottomSheetModal ref={ref} title={title} isCloseDisplayed onClose={onClose}>
            <Box paddingTop="sp16">
                <FlashList
                    data={items}
                    keyExtractor={item => item.id}
                    getItemType={item => item.type}
                    renderItem={renderItem}
                />
            </Box>
        </BottomSheetModal>
    );
};
