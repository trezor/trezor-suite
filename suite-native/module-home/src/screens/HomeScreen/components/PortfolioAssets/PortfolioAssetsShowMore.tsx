import { useSelector } from 'react-redux';

import {
    HOME_ASSET_ROW_LIMIT,
    type HomeAssetTableState,
    selectIsHomeAssetTableFoldable,
} from '@suite-common/assets';
import { selectIsAssetListLoading } from '@suite-native/assets';
import { Divider } from '@suite-native/atoms';

import { PortfolioAssetsCardSegment } from './PortfolioAssetsCardSegment';
import { PortfolioAssetsShowMoreButton } from './PortfolioAssetsShowMoreButton';

type PortfolioAssetsShowMoreProps = {
    isExpanded: boolean;
    onPress: () => void;
};

export const PortfolioAssetsShowMore = ({ isExpanded, onPress }: PortfolioAssetsShowMoreProps) => {
    const isFoldable = useSelector((state: HomeAssetTableState) =>
        selectIsHomeAssetTableFoldable(state, HOME_ASSET_ROW_LIMIT),
    );
    const isAssetListLoading = useSelector(selectIsAssetListLoading);

    if (!isFoldable) {
        return null;
    }

    return (
        <PortfolioAssetsCardSegment isLast>
            <Divider />
            <PortfolioAssetsShowMoreButton
                isExpanded={isExpanded}
                isLoading={isAssetListLoading}
                onPress={onPress}
            />
        </PortfolioAssetsCardSegment>
    );
};
