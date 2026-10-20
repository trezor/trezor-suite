import { BottomSheetModal, type BottomSheetModalRef, Box, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { PortfolioAssetsGroupingOptions } from './PortfolioAssetsGroupingOptions';

type PortfolioAssetsViewOptionsSheetProps = {
    bottomSheetRef: BottomSheetModalRef;
};

export const PortfolioAssetsViewOptionsSheet = ({
    bottomSheetRef,
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
        </VStack>
    </BottomSheetModal>
);
