import { memo } from 'react';
import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { isCryptoIconSymbol } from '@suite-common/icons';
import { selectGetNetworkConfigDep } from '@suite-common/networks';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { CryptoIconWithPercentage } from '@suite-native/icons';

import { selectAssetFiatValuePercentage } from '../assetsSelectors';
import { type AssetsRootState } from '../types';

type PercentageIconProps = { symbol: NetworkSymbol };

export const PercentageIcon = memo(({ symbol }: PercentageIconProps) => {
    const assetPercentages = useSelector((state: AssetsRootState) =>
        selectAssetFiatValuePercentage(state, symbol),
    );
    const { getNetworkConfig } = useServices(selectGetNetworkConfigDep);

    const { color: percentageColor } = getNetworkConfig(symbol);

    if (!isCryptoIconSymbol(symbol)) {
        return null;
    }

    return (
        <CryptoIconWithPercentage
            iconName={symbol}
            percentageColor={percentageColor}
            percentage={assetPercentages.fiatPercentage}
            percentageOffset={assetPercentages.fiatPercentageOffset}
        />
    );
});

PercentageIcon.displayName = 'PercentageIcon';
