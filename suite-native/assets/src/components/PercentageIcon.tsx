import { memo } from 'react';
import { useSelector } from 'react-redux';

import { type NetworksRootState, selectNetworkColor } from '@suite-common/networks';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { CryptoIconWithPercentage } from '@suite-native/icons';

import { selectAssetFiatValuePercentage } from '../assetsSelectors';
import { type AssetsRootState } from '../types';

type PercentageIconProps = { symbol: NetworkSymbol };

export const PercentageIcon = memo(({ symbol }: PercentageIconProps) => {
    const assetPercentages = useSelector((state: AssetsRootState) =>
        selectAssetFiatValuePercentage(state, symbol),
    );
    const percentageColor = useSelector((state: NetworksRootState) =>
        selectNetworkColor(state, symbol),
    );

    return (
        <CryptoIconWithPercentage
            iconName={symbol}
            percentageColor={percentageColor ?? 'transparent'}
            percentage={assetPercentages.fiatPercentage}
            percentageOffset={assetPercentages.fiatPercentageOffset}
        />
    );
});

PercentageIcon.displayName = 'PercentageIcon';
