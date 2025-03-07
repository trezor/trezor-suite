import { CoinInfo, CryptoId } from 'invity-api';

import { parseCryptoId } from '@suite-common/trading';
import { NetworkSymbolExtended } from '@suite-common/wallet-config';
import { TokenAddress } from '@suite-common/wallet-types';

import { TradeableAsset } from './types';

export const coinInfoToTradeableAsset = (
    cryptoId: CryptoId,
    coinInfo: CoinInfo,
): TradeableAsset => {
    const { services, symbol, ...info } = coinInfo;
    const { networkId, contractAddress } = parseCryptoId(cryptoId);
    const isEthNativeCoin =
        symbol === 'eth' && contractAddress === '0x0000000000000000000000000000000000000000';

    return {
        cryptoId,
        symbol: symbol as NetworkSymbolExtended,
        contractAddress: isEthNativeCoin ? undefined : (contractAddress as TokenAddress),
        networkId,
        ...info,
    };
};
