import { useSelector } from 'react-redux';

import { selectIsPortfolioTrackerDevice } from '@suite-common/device';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import {
    Box,
    Card,
    CardDivider,
    HStack,
    PressableOpacity,
    Text,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { YieldClaimRewardsBottomSheet } from './YieldClaimRewardsBottomSheet';
import { YieldClaimRewardsSummaryCard } from './YieldClaimRewardsSummaryCard';
import { YieldPositionsBottomSheet } from './YieldPositionsBottomSheet';
import { YieldPositionsIcons } from './YieldPositionsIcons';
import { useStablecoinYieldFirmwareUpdateAlert } from '../../hooks/yield/useStablecoinYieldFirmwareUpdateAlert';
import {
    type YieldClaimAccountItem,
    type YieldClaimListItem,
    type YieldClaimToken,
    type YieldListItem,
    type YieldListVaultIcon,
} from '../../types';

const iconsContainerStyle = prepareNativeStyle(_ => ({
    flexDirection: 'row',
    alignItems: 'center',
}));

type YieldPositionsCardProps = {
    positions: YieldListItem[];
    icons: YieldListVaultIcon[];
    claimItems: YieldClaimListItem[];
    claimAccountItems: YieldClaimAccountItem[];
    claimTokens: YieldClaimToken[];
    totalClaimableFiatAmount: BaseCurrencyAmount | null;
    isClaimItemsLoading: boolean;
};

export const YieldPositionsCard = ({
    positions,
    icons,
    claimItems,
    claimAccountItems,
    claimTokens,
    totalClaimableFiatAmount,
    isClaimItemsLoading,
}: YieldPositionsCardProps) => {
    const { applyStyle } = useNativeStyles();
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const { isFirmwareSupported, showFirmwareUpdateAlert } =
        useStablecoinYieldFirmwareUpdateAlert();

    const {
        bottomSheetRef: yieldPositionsSheetRef,
        openModal: openYieldPositionsSheet,
        closeModal: closeYieldPositionsSheet,
    } = useBottomSheetModal();

    const {
        bottomSheetRef: yieldClaimRewardsSheetRef,
        openModal: openYieldClaimRewardsSheet,
        closeModal: closeYieldClaimRewardsSheet,
    } = useBottomSheetModal();

    const shouldShowClaimRewardsSection =
        !isPortfolioTrackerDevice && (claimItems.length > 0 || isClaimItemsLoading);

    const onClaimRewardsPress = () => {
        if (!isFirmwareSupported('claim')) {
            showFirmwareUpdateAlert();

            return;
        }

        openYieldClaimRewardsSheet();
    };

    if (positions.length === 0 && !shouldShowClaimRewardsSection) return null;

    return (
        <>
            <Card noPadding borderColor="borderNeutral">
                <VStack spacing={0}>
                    {positions.length > 0 && (
                        <PressableOpacity onPress={openYieldPositionsSheet}>
                            <HStack padding="sp16" justifyContent="space-between">
                                <Text variant="body-md">
                                    <Translation id="earn.earnScreen.depositsCard.defiYieldPositions" />
                                </Text>

                                <HStack spacing="sp12" alignItems="center">
                                    <Box style={applyStyle(iconsContainerStyle)}>
                                        <YieldPositionsIcons vaultIcons={icons} />
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

                    {shouldShowClaimRewardsSection && (
                        <>
                            {positions.length > 0 && <CardDivider horizontalPadding={0} />}

                            <YieldClaimRewardsSummaryCard
                                claimItems={claimItems}
                                claimTokens={claimTokens}
                                totalClaimableFiatAmount={totalClaimableFiatAmount}
                                isLoading={isClaimItemsLoading}
                                onClaimRewardsPress={onClaimRewardsPress}
                            />
                        </>
                    )}
                </VStack>
            </Card>

            <YieldPositionsBottomSheet
                ref={yieldPositionsSheetRef}
                positions={positions}
                onClose={closeYieldPositionsSheet}
            />

            <YieldClaimRewardsBottomSheet
                ref={yieldClaimRewardsSheetRef}
                items={claimAccountItems}
                onClose={closeYieldClaimRewardsSheet}
            />
        </>
    );
};
