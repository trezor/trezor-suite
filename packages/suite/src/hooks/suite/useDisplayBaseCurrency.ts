import { NetworkSymbol } from '@suite-common/wallet-config';
import { selectLocalCurrency } from '@suite-common/wallet-core';
import { isTestnet } from '@suite-common/wallet-utils';

import { useSelector } from './useSelector';

export const useDisplayBaseCurrency = (symbol: NetworkSymbol | undefined) => {
    const baseCurrencyCode = useSelector(selectLocalCurrency);

    return {
        shallDisplayBaseCurrency:
            symbol !== undefined && !isTestnet(symbol) && baseCurrencyCode !== symbol,
    };
};
