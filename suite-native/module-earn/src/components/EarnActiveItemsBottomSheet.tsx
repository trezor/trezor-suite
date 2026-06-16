import { useCallback, useMemo } from 'react';
import { useStore } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { isSupportedSolStakingNetworkSymbol } from '@suite-common/wallet-utils';
import { BottomSheetModal, type BottomSheetModalRef, Box } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { EarnAccountCard } from './EarnAccountCard';
import { useStakingDetailNavigation } from '../hooks/useStakingDetailNavigation';
import { useStakingNavigateAnalytics } from '../hooks/useStakingNavigateAnalytics';
import { type EarnDepositsCardActiveItem } from '../types';

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.StakingManagement>;

type EarnActiveItemsBottomSheetProps = {
    ref: BottomSheetModalRef;
    type: EarnDepositsCardActiveItem['type'];
    items: EarnDepositsCardActiveItem[];
    onClose: () => void;
    onSolanaClaimPress?: () => void;
};

export const EarnActiveItemsBottomSheet = ({
    ref,
    type,
    items,
    onClose,
    onSolanaClaimPress,
}: EarnActiveItemsBottomSheetProps) => {
    const navigation = useNavigation<NavigationProp>();
    const { navigateToStakingDetail } = useStakingDetailNavigation();
    const reportStakingNavigate = useStakingNavigateAnalytics();
    const store = useStore<AccountsRootState>();

    const title = useMemo(
        () =>
            type === 'staking' ? (
                <Translation id="earn.earnScreen.activeSheet.stakingTitle" />
            ) : (
                <Translation id="earn.earnScreen.activeSheet.stablecoinYieldTitle" />
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
                        symbol: item.symbol,
                    });
                    break;
                }
                case 'stablecoin-yield':
                    navigation.navigate(RootStackRoutes.AccountDetail, {
                        accountKey: item.accountKey,
                        tokenContract: item.contractAddress,
                        closeActionType: 'back',
                    });
                    break;
            }
        },
        [navigateToStakingDetail, navigation, onClose, reportStakingNavigate, store],
    );

    const handleClaimPress = useCallback(
        (item: EarnDepositsCardActiveItem) => {
            if (item.type !== 'staking') return;

            // Temporary: claiming Solana rewards is not yet available in the mobile app,
            // so we point users to Trezor Suite desktop instead of opening the claim flow.
            if (isSupportedSolStakingNetworkSymbol(item.symbol)) {
                onClose();
                onSolanaClaimPress?.();

                return;
            }

            onClose();
            navigation.navigate(RootStackRoutes.ClaimReview, {
                accountKey: item.accountKey,
                symbol: item.symbol,
            });
        },
        [navigation, onClose, onSolanaClaimPress],
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
