import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { CryptoIconWithPercentage } from '@suite-native/icons';

import { selectAssetFiatValuePercentage } from '../assetsSelectors';
import { type AssetsRootState } from '../types';

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
