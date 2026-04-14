import { type NetworkSymbol, getCoingeckoId, isNetworkSymbol } from '@suite-common/wallet-config';

import { type AssetLogoProps, AssetLogoWithId } from './AssetLogoWithId';
import { type LegacyNetworkSymbol } from '../../constants/networks';
import { CoinLogo } from '../CoinLogo/CoinLogo';

export const AssetLogo = ({ coingeckoId, symbol, size, ...rest }: AssetLogoProps) => {
    const resolvedCoingeckoId =
        (symbol && isNetworkSymbol(symbol) ? getCoingeckoId(symbol) : undefined) ?? coingeckoId;

    if (!resolvedCoingeckoId) {
        return (
            <CoinLogo
                size={size}
                symbol={symbol as NetworkSymbol | LegacyNetworkSymbol}
                type="tokenWithNetwork"
            />
        );
    }

    return (
        <AssetLogoWithId coingeckoId={resolvedCoingeckoId} symbol={symbol} size={size} {...rest} />
    );
};
