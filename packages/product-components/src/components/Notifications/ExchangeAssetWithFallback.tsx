import { getDisplaySymbol } from '@suite-common/wallet-config';

import { type ExchangeInfoAsset } from './notificationsTypes';
import { TokenLogo } from '../TokenLogo/TokenLogo';

type ExchangeAssetWithFallbackProps = {
    asset: ExchangeInfoAsset;
};

export const ExchangeAssetWithFallback = ({ asset }: ExchangeAssetWithFallbackProps) => {
    const resolvedDisplaySymbol = asset.displaySymbol ?? getDisplaySymbol(asset.symbol);

    return (
        asset.icon ?? (
            <TokenLogo
                size={20}
                contractAddress={asset.contractAddress}
                symbol={asset.symbol}
                placeholder={resolvedDisplaySymbol}
            />
        )
    );
};
