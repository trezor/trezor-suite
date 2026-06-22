import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { CryptoIconWithPercentage } from '@suite-native/icons';

import { type AssetsRootState, selectAssetFiatValuePercentage } from '../assetsSelectors';

type PercentageIconProps = { symbol: NetworkSymbol };

export const PercentageIcon = ({ symbol }: PercentageIconProps) => {
    const assetPercentages = useSelector((state: AssetsRootState) =>
        selectAssetFiatValuePercentage(state, symbol),
    );

    return (
        <CryptoIconWithPercentage
            iconName={symbol}
            percentage={assetPercentages.fiatPercentage}
            percentageOffset={assetPercentages.fiatPercentageOffset}
        />
    );
};
