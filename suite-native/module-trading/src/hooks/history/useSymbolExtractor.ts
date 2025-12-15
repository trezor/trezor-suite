import { useSelector } from 'react-redux';

import type { CryptoId } from 'invity-api';

import type { TradingRootState } from '@suite-common/trading';
import { selectTradingCoinSymbolByCryptoId } from '@suite-common/trading';

export const useSymbolExtractor = (cryptoId: CryptoId | undefined) => {
    const symbol = useSelector((state: TradingRootState) =>
        selectTradingCoinSymbolByCryptoId(state, cryptoId),
    );

    return symbol ?? cryptoId;
};
