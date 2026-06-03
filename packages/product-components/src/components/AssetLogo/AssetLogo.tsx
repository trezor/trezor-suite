import { isCryptoIconSymbol } from '@suite-common/icons/src/iconUtils';
import { getCoingeckoId, isNetworkSymbol } from '@suite-common/wallet-config';

import { type AssetLogoProps, AssetLogoWithId } from './AssetLogoWithId';
import { CoinLogo } from '../CoinLogo/CoinLogo';

export type { AssetLogoProps };

export const AssetLogo = ({ symbol, size, ...rest }: AssetLogoProps) => {
    const coingeckoId = isNetworkSymbol(symbol) ? getCoingeckoId(symbol) : undefined;

    if (!coingeckoId) {
        if (isCryptoIconSymbol(symbol)) {
            return <CoinLogo size={size} symbol={symbol} type="token" />;
        }

        return null;
    }

    return <AssetLogoWithId coingeckoId={coingeckoId} symbol={symbol} size={size} {...rest} />;
};
