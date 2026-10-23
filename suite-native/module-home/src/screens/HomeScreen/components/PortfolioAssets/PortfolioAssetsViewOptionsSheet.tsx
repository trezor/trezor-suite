import { BottomSheetModal, type BottomSheetModalRef, Box, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { PortfolioAssetsGroupingOptions } from './PortfolioAssetsGroupingOptions';
import { PortfolioAssetsSmallBalancesSwitch } from './PortfolioAssetsSmallBalancesSwitch';

type PortfolioAssetsViewOptionsSheetProps = {
    bottomSheetRef: BottomSheetModalRef;
    onSmallBalancesChange: (areShown: boolean) => void;
};

export const PortfolioAssetsViewOptionsSheet = ({
    bottomSheetRef,
    onSmallBalancesChange,
}: PortfolioAssetsViewOptionsSheetProps) => (
    <BottomSheetModal
        ref={bottomSheetRef}
        title={<Translation id="moduleHome.assets.viewOptionsSheet.title" />}
        isCloseDisplayed
    >
        <VStack spacing="sp8">
            <Box paddingHorizontal="sp4">
                <Text variant="body-xs" color="contentTertiary">
                    <Translation id="moduleHome.assets.viewOptionsSheet.groupBy" />
                </Text>
            </Box>
            <PortfolioAssetsGroupingOptions />
            <PortfolioAssetsSmallBalancesSwitch onChange={onSmallBalancesChange} />
        </VStack>
    </BottomSheetModal>
);
