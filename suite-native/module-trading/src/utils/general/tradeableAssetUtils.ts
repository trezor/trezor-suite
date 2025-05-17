import { CoinInfo, CryptoId } from 'invity-api';

import { cryptoIdToSymbol, isCryptoIdForNativeToken, parseCryptoId } from '@suite-common/trading';
import { NetworkSymbolExtended } from '@suite-common/wallet-config';
import { TokenAddress } from '@suite-common/wallet-types';

import { TradeableAsset, TradingBuyForm } from '../../types';

const FAVOURITE_NETWORKS_PRIORITY_ORDER = ['bitcoin', 'ethereum', 'litecoin', 'cardano', 'solana'];

const getNonFavouritePriority = ({ contractAddress }: TradeableAsset) =>
    FAVOURITE_NETWORKS_PRIORITY_ORDER.length + (contractAddress ? 1 : 0);

export const tradeableAssetSortingComparator = (a: TradeableAsset, b: TradeableAsset) => {
    let indexA = FAVOURITE_NETWORKS_PRIORITY_ORDER.indexOf(a.cryptoId);
    let indexB = FAVOURITE_NETWORKS_PRIORITY_ORDER.indexOf(b.cryptoId);

    if (indexA === -1) {
        indexA = getNonFavouritePriority(a);
    }

    if (indexB === -1) {
        indexB = getNonFavouritePriority(b);
    }

    return indexA - indexB;
};

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

export const getSelectedSymbolFromBuyForm = (form: TradingBuyForm) => {
    const cryptoId = form.watch('asset')?.cryptoId;

    return cryptoId ? cryptoIdToSymbol(cryptoId) : undefined;
};
