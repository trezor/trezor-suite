import { TradingTransaction } from '@suite-common/trading';

import { useSymbolExtractor } from './useSymbolExtractor';
import { getTradeOperationData } from '../utils/tradeUtils';

export const useChangeStringsExtractor = (transaction: TradingTransaction | undefined) => {
    const { fromValue, fromCryptoId, toValue, toCryptoId } = getTradeOperationData(transaction);
    const fromSymbol = useSymbolExtractor(fromCryptoId);
    const toSymbol = useSymbolExtractor(toCryptoId);

    return {
        fromStringValue: `${fromValue ?? ''} ${fromSymbol ?? ''}`,
        toStringValue: `${toValue ?? ''} ${toSymbol ?? ''}`,
        fromValue,
        fromSymbol,
        fromCryptoId,
        toValue,
        toSymbol,
        toCryptoId,
    };
};
