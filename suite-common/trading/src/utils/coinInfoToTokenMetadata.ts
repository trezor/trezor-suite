import { type CoinInfo } from 'invity-api';

import { type TokenMetadata } from '@suite-common/token';
import { type TokenAddress } from '@suite-common/tokens';

export const coinInfoToTokenMetadata = (contract: TokenAddress, coin: CoinInfo): TokenMetadata => ({
    contract,
    name: coin.name,
    symbol: coin.symbol.toUpperCase(),
});
