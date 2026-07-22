import { useSelector } from 'react-redux';

import { convertCryptoToFiatAmount } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type FiatRatesRootState,
    selectBaseCurrency,
    selectFiatRatesByFiatRateKey,
} from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import { getFiatRateKey, isTestnet, toFiatCurrency } from '@suite-common/wallet-utils';

import { convertTokenValueToDecimal } from '../utils';

type useFiatFromCryptoValueParams = {
    cryptoValue: string | null;
    symbol: NetworkSymbol;
    tokenAddress?: TokenAddress;
    tokenDecimals?: number;
    historicRate?: number;
    useHistoricRate?: boolean;
    isBalance?: boolean;
};

export const useFiatFromCryptoValue = ({
    cryptoValue,
    symbol,
    tokenAddress,
    historicRate,
    useHistoricRate,
    isBalance = false,
    tokenDecimals = 0,
}: useFiatFromCryptoValueParams) => {
    const fiatCurrencyCode = useSelector(selectBaseCurrency);
    const fiatRateKey = getFiatRateKey(symbol, fiatCurrencyCode, tokenAddress);
    const currentRate = useSelector((state: FiatRatesRootState) =>
        selectFiatRatesByFiatRateKey(state, fiatRateKey),
    );

    const rate = useHistoricRate ? historicRate : currentRate?.rate;

    const isTestnetCoin = isTestnet(symbol);

    if (!cryptoValue || isTestnetCoin) return null;

    if (tokenAddress) {
        const decimalValue = convertTokenValueToDecimal(cryptoValue, tokenDecimals);

        // Zero balance always yields zero fiat regardless of rate — rate: 1 is a dummy (0 × n = 0).
        if (decimalValue.isZero()) return toFiatCurrency({ amount: '0', rate: 1 });
        if (!rate || currentRate?.error) return null;

        return toFiatCurrency({ amount: decimalValue.toString(), rate });
    }

    if (!rate || currentRate?.error) return null;

    return convertCryptoToFiatAmount({
        amount: cryptoValue,
        symbol,
        isAmountInSats: !isBalance,
        rate,
    });
};
