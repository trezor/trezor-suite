import { getCoingeckoId, getDisplaySymbol } from '@suite-common/wallet-config';

import { type ExchangeInfoAsset } from './notificationsTypes';
import { AssetLogo } from '../AssetLogo/AssetLogo';

type ExchangeAssetWithFallbackProps = {
    asset: ExchangeInfoAsset;
};

export const ExchangeAssetWithFallback = ({ asset }: ExchangeAssetWithFallbackProps) => {
    const resolvedDisplaySymbol = asset.displaySymbol ?? getDisplaySymbol(asset.symbol);
    const resolvedCoingeckoId = asset.coingeckoId ?? getCoingeckoId(asset.symbol) ?? '';

    return (
        asset.icon ?? (
            <AssetLogo
                size={20}
                coingeckoId={resolvedCoingeckoId}
                contractAddress={asset.contractAddress}
                symbol={asset.symbol}
                placeholder={resolvedDisplaySymbol}
            />
        )
    );
};
