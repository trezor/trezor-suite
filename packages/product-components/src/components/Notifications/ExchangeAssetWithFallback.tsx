import { getDisplaySymbol } from '@suite-common/wallet-config';

import { type ExchangeInfoAsset } from './notificationsTypes';
import { AssetLogo } from '../AssetLogo/AssetLogo';

type ExchangeAssetWithFallbackProps = {
    asset: ExchangeInfoAsset;
};

export const ExchangeAssetWithFallback = ({ asset }: ExchangeAssetWithFallbackProps) => {
    const resolvedDisplaySymbol = asset.displaySymbol ?? getDisplaySymbol(asset.symbol);

    return (
        asset.icon ?? (
            <AssetLogo
                size={20}
                contractAddress={asset.contractAddress}
                symbol={asset.symbol}
                placeholder={resolvedDisplaySymbol}
            />
        )
    );
};
