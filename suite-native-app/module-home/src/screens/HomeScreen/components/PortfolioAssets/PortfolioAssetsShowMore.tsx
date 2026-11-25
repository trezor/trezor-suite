import { useSelector } from 'react-redux';

import {
    ASSET_TABLE_ROW_LIMIT,
    type AssetTableState,
    selectIsHomeAssetTableFoldable,
} from '@suite-common/assets';
import { WalletAssetCardSegment, selectIsAssetListLoading } from '@suite-native/assets';
import { Divider } from '@suite-native/atoms';

import { PortfolioAssetsShowMoreButton } from './PortfolioAssetsShowMoreButton';

type PortfolioAssetsShowMoreProps = {
    isExpanded: boolean;
    onPress: () => void;
};

export const PortfolioAssetsShowMore = ({ isExpanded, onPress }: PortfolioAssetsShowMoreProps) => {
    const isFoldable = useSelector((state: AssetTableState) =>
        selectIsHomeAssetTableFoldable(state, ASSET_TABLE_ROW_LIMIT),
    );
    const isAssetListLoading = useSelector(selectIsAssetListLoading);

    if (!isFoldable) {
        return null;
    }

    return (
        <WalletAssetCardSegment isLast>
            <Divider />
            <PortfolioAssetsShowMoreButton
                isExpanded={isExpanded}
                isLoading={isAssetListLoading}
                onPress={onPress}
            />
        </WalletAssetCardSegment>
    );
};
