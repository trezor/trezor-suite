import { useCallback, useMemo } from 'react';

import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';

import { BottomSheetModal, type BottomSheetModalRef, Box } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { useStakingDetailNavigation } from '../hooks/useStakingDetailNavigation';
import { type EarnDepositsCardActiveItem } from '../types';
import { EarnAccountCard } from './EarnAccountCard';

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
    const { navigateToStakingDetail } = useStakingDetailNavigation();

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
                case 'staking':
                    navigateToStakingDetail({
                        accountKey: item.accountKey,
                        symbol: item.symbol,
                    });
                    break;
                case 'stablecoin-yield':
                    navigation.navigate(RootStackRoutes.AccountDetail, {
                        accountKey: item.accountKey,
                        tokenContract: item.contractAddress,
                        closeActionType: 'back',
                    });
                    break;
            }
        },
        [navigateToStakingDetail, navigation, onClose],
    );

    const handleClaimPress = useCallback(
        (item: EarnDepositsCardActiveItem) => {
            if (item.type !== 'staking') return;

            onClose();
            navigation.navigate(RootStackRoutes.ClaimReview, {
                accountKey: item.accountKey,
                symbol: item.symbol,
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
