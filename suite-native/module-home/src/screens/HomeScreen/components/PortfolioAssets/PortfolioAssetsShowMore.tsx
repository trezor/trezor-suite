import { useSelector } from 'react-redux';

import {
    HOME_ASSET_ROW_LIMIT,
    type HomeAssetTableState,
    selectIsHomeAssetTableFoldable,
} from '@suite-common/assets';
import { Divider, VStack } from '@suite-native/atoms';

import { PortfolioAssetsShowMoreButton } from './PortfolioAssetsShowMoreButton';

type PortfolioAssetsShowMoreProps = {
    isExpanded: boolean;
    onPress: () => void;
};

export const PortfolioAssetsShowMore = ({ isExpanded, onPress }: PortfolioAssetsShowMoreProps) => {
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
                <PortfolioAssetsShowMoreButton isExpanded={isExpanded} onPress={onPress} />
            </VStack>
        </>
    );
};
