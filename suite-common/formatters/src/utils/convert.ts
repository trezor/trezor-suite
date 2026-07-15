import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { formatNetworkAmount, toFiatCurrency } from '@suite-common/wallet-utils';

type ConvertInput = {
    amount: string | null;
    symbol: NetworkSymbol;
    isAmountInSats?: boolean;
    rate?: number;
};

/**
 * @deprecated use `toFiatCurrency` directly
 */
export const convertCryptoToFiatAmount = ({
    amount,
    symbol,
    isAmountInSats = true,
    rate,
}: ConvertInput): BaseCurrencyAmount | null => {
    if (!amount) {
        return null;
    }

    const networkAmount = isAmountInSats ? formatNetworkAmount(amount, symbol) : amount;

    return toFiatCurrency({ amount: networkAmount, rate });
};
