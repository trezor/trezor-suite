import { useSelector } from 'react-redux';

import {
    HOME_ASSET_ROW_LIMIT,
    type HomeAssetTableState,
    selectIsHomeAssetTableFoldable,
} from '@suite-common/assets';
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

    if (!isFoldable) {
        return null;
    }

    return (
        <PortfolioAssetsCardSegment isLast>
            <Divider />
            <PortfolioAssetsShowMoreButton isExpanded={isExpanded} onPress={onPress} />
        </PortfolioAssetsCardSegment>
    );
};
