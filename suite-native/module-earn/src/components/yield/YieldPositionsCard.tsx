import { useSelector } from 'react-redux';

import { selectIsPortfolioTrackerDevice } from '@suite-common/device';
import {
    type EarnListRootState,
    selectYieldClaimListItems,
    selectYieldListItems,
    useYieldClaimRewardsWithFiat,
    useYieldOpportunities,
} from '@suite-common/wallet-core';
import {
    Box,
    Card,
    HStack,
    PressableOpacity,
    Text,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { YieldClaimRewardsSummaryCard } from './YieldClaimRewardsSummaryCard';
import { YieldPositionsBottomSheet } from './YieldPositionsBottomSheet';
import { YieldPositionsIcons } from './YieldPositionsIcons';

export const YieldPositionsCard = () => {
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);

    const { yieldOpportunities } = useYieldOpportunities();
    const { claimRewardsWithFiat, isClaimLoading } = useYieldClaimRewardsWithFiat();

    const positions = useSelector((state: EarnListRootState) =>
        selectYieldListItems(state, yieldOpportunities),
    );

    const claimItems = useSelector((state: EarnListRootState) =>
        selectYieldClaimListItems(state, claimRewardsWithFiat),
    );

    const {
        bottomSheetRef: yieldPositionsSheetRef,
        openModal: openYieldPositionsSheet,
        closeModal: closeYieldPositionsSheet,
    } = useBottomSheetModal();

    const isPositionsVisible = positions.length > 0;
    const isClaimRewardsVisible =
        isPortfolioTrackerDevice || claimItems.length > 0 || isClaimLoading;

    if (!isPositionsVisible && !isClaimRewardsVisible) return null;

    return (
        <>
            <Card noPadding borderColor="borderNeutral">
                <VStack spacing={0}>
                    {isPositionsVisible && (
                        <PressableOpacity onPress={openYieldPositionsSheet}>
                            <HStack padding="sp16" justifyContent="space-between">
                                <Text variant="body-md">
                                    <Translation id="earn.earnScreen.depositsCard.defiYieldPositions" />
                                </Text>

                                <HStack spacing="sp12" alignItems="center">
                                    <Box flexDirection="row" alignItems="center">
                                        <YieldPositionsIcons />
                                    </Box>

                                    <Icon
                                        name="caretRight"
                                        size="mediumLarge"
                                        color="contentSecondary"
                                    />
                                </HStack>
                            </HStack>
                        </PressableOpacity>
                    )}

                    {isClaimRewardsVisible && <YieldClaimRewardsSummaryCard />}
                </VStack>
            </Card>

            <YieldPositionsBottomSheet
                ref={yieldPositionsSheetRef}
                positions={positions}
                onClose={closeYieldPositionsSheet}
            />
        </>
    );
};
