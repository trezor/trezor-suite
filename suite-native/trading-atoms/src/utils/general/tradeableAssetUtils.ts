import type { CoinInfo, CryptoId } from 'invity-api';

import { cryptoIdToSymbol, isCryptoIdForNativeToken, parseCryptoId } from '@suite-common/trading';
import { NetworkSymbolExtended } from '@suite-common/wallet-config';
import { TokenAddress } from '@suite-common/wallet-types';
import { TradeableAsset } from '@suite-native/trading-types';

export const coinInfoToTradeableAsset = (
    cryptoId: CryptoId,
    coinInfo: CoinInfo,
): TradeableAsset => {
    const { services, symbol, ...info } = coinInfo;
    const { networkId, contractAddress } = parseCryptoId(cryptoId);
    const isEthNativeCoin = symbol === 'eth' && isCryptoIdForNativeToken(cryptoId);

    return {
        cryptoId,
        symbol: symbol as NetworkSymbolExtended,
        contractAddress: isEthNativeCoin ? undefined : (contractAddress as TokenAddress),
        networkId,
        ...info,
    };
};

export const getSymbolFromTradeableAsset = (asset: TradeableAsset | undefined) =>
    asset?.cryptoId ? cryptoIdToSymbol(asset.cryptoId) : undefined;
