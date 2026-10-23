import { useSelector } from 'react-redux';

import {
    HOME_ASSET_ROW_LIMIT,
    type HomeAssetTableState,
    selectIsHomeAssetTableFoldable,
} from '@suite-common/assets';
import { Divider, VStack } from '@suite-native/atoms';

import { PortfolioAssetsFeedback } from './PortfolioAssetsFeedback';
import { PortfolioAssetsShowMoreButton } from './PortfolioAssetsShowMoreButton';

type PortfolioAssetsListFooterProps = {
    isExpanded: boolean;
    onShowMorePress: () => void;
};

export const PortfolioAssetsListFooter = ({
    isExpanded,
    onShowMorePress,
}: PortfolioAssetsListFooterProps) => {
    const isFoldable = useSelector((state: HomeAssetTableState) =>
        selectIsHomeAssetTableFoldable(state, HOME_ASSET_ROW_LIMIT),
    );

    return (
        <>
            {isFoldable && (
                <>
                    <Divider />
                    <VStack alignItems="center" paddingVertical="sp12">
                        <PortfolioAssetsShowMoreButton
                            isExpanded={isExpanded}
                            onPress={onShowMorePress}
                        />
                    </VStack>
                </>
            )}
            <PortfolioAssetsFeedback />
        </>
    );
};
