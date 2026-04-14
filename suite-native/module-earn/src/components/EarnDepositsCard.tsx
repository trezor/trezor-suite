import { Box, Card, Text, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { useEarnDepositsCardData } from '../hooks/useEarnDepositsCardData';
import { type StablecoinYieldEarnItem, type StakingEarnItem } from '../types';
import { EarnActiveItemsBottomSheet } from './EarnActiveItemsBottomSheet';
import { EarnDepositsCardRow } from './EarnDepositsCardRow';

const cardHeaderStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.sp16,
}));

type EarnDepositsCardProps = {
    stakingActiveItems: StakingEarnItem[];
    stablecoinYieldActiveItems: StablecoinYieldEarnItem[];
};

export const EarnDepositsCard = ({
    stakingActiveItems,
    stablecoinYieldActiveItems,
}: EarnDepositsCardProps) => {
    const { applyStyle } = useNativeStyles();
    const { stakingRow, stablecoinYieldRow, totalDepositedFiatAmount } = useEarnDepositsCardData({
        stakingActiveItems,
        stablecoinYieldActiveItems,
    });
    const {
        bottomSheetRef: stakingSheetRef,
        closeModal: closeStakingSheet,
        openModal: openStakingSheet,
    } = useBottomSheetModal();

    const {
        bottomSheetRef: stablecoinYieldSheetRef,
        closeModal: closeStablecoinYieldSheet,
        openModal: openStablecoinYieldSheet,
    } = useBottomSheetModal();

    return (
        <>
            <Box marginBottom="sp32">
                <Card borderColor="borderNeutral" noPadding testID="@earn/deposits-card">
                    <Box style={applyStyle(cardHeaderStyle)}>
                        <VStack spacing={2}>
                            <Text variant="body-md" color="contentSecondary">
                                <Translation id="earn.earnScreen.depositsCard.title" />
                            </Text>
                            <BaseCurrencyAmountFormatter
                                value={totalDepositedFiatAmount}
                                variant="headline-md"
                                isDiscreetText={false}
                            />
                        </VStack>
                    </Box>

                    {stakingRow && (
                        <EarnDepositsCardRow
                            key={stakingRow.type}
                            row={stakingRow}
                            onPress={openStakingSheet}
                        />
                    )}
                    {stablecoinYieldRow && (
                        <EarnDepositsCardRow
                            key={stablecoinYieldRow.type}
                            row={stablecoinYieldRow}
                            onPress={openStablecoinYieldSheet}
                        />
                    )}
                </Card>
            </Box>

            <EarnActiveItemsBottomSheet
                ref={stakingSheetRef}
                type="staking"
                items={stakingRow?.activeItems ?? []}
                onClose={closeStakingSheet}
            />
            <EarnActiveItemsBottomSheet
                ref={stablecoinYieldSheetRef}
                type="stablecoin-yield"
                items={stablecoinYieldRow?.activeItems ?? []}
                onClose={closeStablecoinYieldSheet}
            />
        </>
    );
};
