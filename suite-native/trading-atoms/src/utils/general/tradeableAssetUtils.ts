import type { CoinInfo, CryptoId } from 'invity-api';

import {
    cryptoIdToNetworkSymbol,
    isCryptoIdForNativeToken,
    parseCryptoId,
} from '@suite-common/trading';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { type TradeableAsset } from '@suite-native/trading-types';

export const coinInfoToTradeableAsset = (
    cryptoId: CryptoId,
    coinInfo: CoinInfo,
): TradeableAsset => {
    const { services, symbol, ...info } = coinInfo;
    const { networkId, contractAddress } = parseCryptoId(cryptoId);
    const isEthNativeCoin = symbol === 'eth' && isCryptoIdForNativeToken(cryptoId);

    const tokenContractAddress = isEthNativeCoin ? undefined : (contractAddress as TokenAddress);

    // `CoinInfo` (`symbol`/`name`) is declared with required `string` fields, but `coins` comes
    // verbatim from an untrusted/user-selectable trade server (`tradeApi.getInfo()` returns the
    // response unvalidated). A poison coin with a missing/non-string `symbol` would throw on
    // `.toUpperCase()`, and a non-string `name` would later throw in `normalizeForSearch` (String
    // .normalize) when the asset picker builds its search index — both inside memoized selectors /
    // `useMemo` consumed during render, so one bad record crashes the whole trading asset picker.
    const safeSymbol = typeof symbol === 'string' ? symbol : '';

    return {
        cryptoId,
        symbol: getDisplaySymbol(safeSymbol.toUpperCase(), tokenContractAddress),
        contractAddress: tokenContractAddress,
        networkId,
        ...info,
        name: typeof info.name === 'string' ? info.name : '',
    };
};

export const getSymbolFromTradeableAsset = (asset: TradeableAsset | undefined) =>
    asset?.cryptoId ? cryptoIdToNetworkSymbol(asset.cryptoId) : undefined;
