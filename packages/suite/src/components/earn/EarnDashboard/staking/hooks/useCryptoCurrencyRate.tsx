import { NetworkSymbol } from '@suite-common/wallet-config';
import { selectBaseCurrency, selectFiatRatesByFiatRateKey } from '@suite-common/wallet-core';
import { getFiatRateKey } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';

export const useCryptoCurrentRate = (symbol: NetworkSymbol) => {
    const baseCurrency = useSelector(selectBaseCurrency);
    const fiatRateKey = getFiatRateKey(symbol, baseCurrency);
    const currentRate = useSelector(state => selectFiatRatesByFiatRateKey(state, fiatRateKey));

    return currentRate?.rate;
};
