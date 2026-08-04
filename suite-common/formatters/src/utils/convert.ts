import type { GetNetworkConfigDep } from '@suite-common/networks';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { formatNetworkAmount, toFiatCurrency } from '@suite-common/wallet-utils';

type ConvertInput = GetNetworkConfigDep & {
    amount: string | null;
    symbol: NetworkSymbol;
    isAmountInSats?: boolean;
    rate?: number;
};

/**
 * @deprecated use `toFiatCurrency` directly
 */
export const convertCryptoToFiatAmount = ({
    getNetworkConfig,
    amount,
    symbol,
    isAmountInSats = true,
    rate,
}: ConvertInput): BaseCurrencyAmount | null => {
    if (!amount) {
        return null;
    }

    const networkAmount = isAmountInSats
        ? formatNetworkAmount({ getNetworkConfig }, amount, symbol)
        : amount;

    return toFiatCurrency({ amount: networkAmount, rate });
};
