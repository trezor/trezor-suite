import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { isTestnet } from '@suite-common/wallet-utils';
import { isNotNullOrUndefined } from '@trezor/utils';

import { selectBaseCurrency } from './walletSettingsReducer';

export const useDisplayBaseCurrency = (symbol: NetworkSymbol | undefined | null) => {
    const baseCurrencyCode = useSelector(selectBaseCurrency);

    return {
        shallDisplayBaseCurrency:
            isNotNullOrUndefined(symbol) && !isTestnet(symbol) && baseCurrencyCode !== symbol,
    };
};
