import { formatNetworkAmount, toFiatCurrency } from '@suite-common/wallet-utils';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { CurrentFiatRates } from '@suite-common/wallet-types';
import { FiatCurrencyCode } from '@suite-common/suite-config';

type CryptoToFiatAmountValue = string | null;

export const convertCryptoToFiatAmount = ({
    value,
    rates,
    fiatCurrency,
    network,
}: {
    value: CryptoToFiatAmountValue;
    rates: CurrentFiatRates['rates'];
    fiatCurrency: FiatCurrencyCode;
    network: NetworkSymbol;
}): string | null => {
    if (!value) return null;

    const transactionAmount = formatNetworkAmount(value, network);
    const fiatAmount = toFiatCurrency(transactionAmount, fiatCurrency, rates);

    return fiatAmount;
};
