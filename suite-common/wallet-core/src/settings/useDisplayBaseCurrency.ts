import { useSelector } from 'react-redux';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { isTestnet } from '@suite-common/wallet-utils';

import { selectLocalCurrency } from './walletSettingsReducer';

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
