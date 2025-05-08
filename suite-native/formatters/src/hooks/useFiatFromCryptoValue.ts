import { useSelector } from 'react-redux';

import { convertCryptoToFiatAmount } from '@suite-common/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    FiatRatesRootState,
    selectFiatRatesByFiatRateKey,
    selectLocalCurrency,
} from '@suite-common/wallet-core';
import { TokenAddress } from '@suite-common/wallet-types';
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
    const fiatCurrencyCode = useSelector(selectLocalCurrency);
    const fiatRateKey = getFiatRateKey(symbol, fiatCurrencyCode, tokenAddress);
    const currentRate = useSelector((state: FiatRatesRootState) =>
        selectFiatRatesByFiatRateKey(state, fiatRateKey),
    );

    const rate = useHistoricRate ? historicRate : currentRate?.rate;

    const isTestnetCoin = isTestnet(symbol);

    if (!cryptoValue || !rate || currentRate?.error || isTestnetCoin) return null;

    if (tokenAddress) {
        const decimalValue = convertTokenValueToDecimal(cryptoValue, tokenDecimals);

        return toFiatCurrency(decimalValue.toString(), rate);
    }

    return convertCryptoToFiatAmount({
        amount: cryptoValue,
        symbol,
        isAmountInSats: !isBalance,
        rate,
    });
};
