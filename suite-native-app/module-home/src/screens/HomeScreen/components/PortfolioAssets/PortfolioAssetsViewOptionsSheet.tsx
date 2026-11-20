import { BottomSheetModal, type BottomSheetModalRef } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { PortfolioAssetsGroupingOptions } from './PortfolioAssetsGroupingOptions';
import { PortfolioAssetsTokensOptions } from './PortfolioAssetsTokensOptions';
import { PortfolioAssetsViewOptionsSectionLabel } from './PortfolioAssetsViewOptionsSectionLabel';

// The section divider spans the full sheet width, so the rows inset themselves instead.
const sheetContentStyle = prepareNativeStyle(() => ({
    marginHorizontal: 0,
}));

type PortfolioAssetsViewOptionsSheetProps = {
    bottomSheetRef: BottomSheetModalRef;
    onSmallBalancesChange: (areShown: boolean) => void;
    onHiddenTokensPress: () => void;
};

export const PortfolioAssetsViewOptionsSheet = ({
    bottomSheetRef,
    onSmallBalancesChange,
    onHiddenTokensPress,
}: PortfolioAssetsViewOptionsSheetProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <BottomSheetModal
            ref={bottomSheetRef}
            title={<Translation id="moduleHome.assets.viewOptionsSheet.title" />}
            isCloseDisplayed
            style={applyStyle(sheetContentStyle)}
        >
            <PortfolioAssetsViewOptionsSectionLabel labelId="moduleHome.assets.viewOptionsSheet.groupBy" />
            <PortfolioAssetsGroupingOptions />
            <PortfolioAssetsTokensOptions
                onSmallBalancesChange={onSmallBalancesChange}
                onHiddenTokensPress={onHiddenTokensPress}
            />
        </BottomSheetModal>
    );
};
