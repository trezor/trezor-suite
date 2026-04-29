import { type NetworkSymbol, getCoingeckoId, isNetworkSymbol } from '@suite-common/wallet-config';

import { type AssetLogoProps, AssetLogoWithId } from './AssetLogoWithId';
import { type LegacyNetworkSymbol } from '../../constants/networks';
import { CoinLogo } from '../CoinLogo/CoinLogo';

export type { AssetLogoProps };

export const AssetLogo = ({ symbol, size, ...rest }: AssetLogoProps) => {
    const coingeckoId = isNetworkSymbol(symbol) ? getCoingeckoId(symbol) : undefined;

    if (!coingeckoId) {
        return (
            <CoinLogo
                size={size}
                symbol={symbol as NetworkSymbol | LegacyNetworkSymbol}
                type="token"
            />
        );
    }

    return <AssetLogoWithId coingeckoId={coingeckoId} symbol={symbol} size={size} {...rest} />;
};
