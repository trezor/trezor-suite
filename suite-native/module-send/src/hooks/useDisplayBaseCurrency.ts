import { useSelector } from 'react-redux';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { selectLocalCurrency } from '@suite-common/wallet-core';
import { isTestnet } from '@suite-common/wallet-utils';

// Todo: dedupe with `packages/suite/src/hooks/suite/useDisplayBaseCurrency.ts`
export const useDisplayBaseCurrency = (symbol: NetworkSymbol | undefined | null) => {
    const baseCurrencyCode = useSelector(selectLocalCurrency);

    return {
        shallDisplayBaseCurrency:
            symbol !== undefined &&
            symbol !== null &&
            !isTestnet(symbol) &&
            baseCurrencyCode !== symbol,
    };
};
