import { useSelector } from 'react-redux';

import {
    HOME_ASSET_ROW_LIMIT,
    type HomeAssetTableState,
    selectIsHomeAssetTableFoldable,
} from '@suite-common/assets';
import { Divider, VStack } from '@suite-native/atoms';

import { PortfolioAssetsShowMoreButton } from './PortfolioAssetsShowMoreButton';

type PortfolioAssetsListFooterProps = {
    isListExpanded: boolean;
    onShowMorePress: () => void;
};

export const PortfolioAssetsListFooter = ({
    isListExpanded,
    onShowMorePress,
}: PortfolioAssetsListFooterProps) => {
    const isFoldable = useSelector((state: HomeAssetTableState) =>
        selectIsHomeAssetTableFoldable(state, HOME_ASSET_ROW_LIMIT),
    );

    if (!isFoldable) {
        return null;
    }

    return (
        <>
            <Divider />
            <VStack alignItems="center" paddingVertical="sp12">
                <PortfolioAssetsShowMoreButton
                    isExpanded={isListExpanded}
                    onPress={onShowMorePress}
                />
            </VStack>
        </>
    );
};
