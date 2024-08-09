import { formatNetworkAmount, toFiatCurrency } from '@suite-common/wallet-utils';
import { NetworkSymbol } from '@suite-common/wallet-config';

type CryptoToFiatAmountValue = string | null;

export const convertCryptoToFiatAmount = ({
    value,
    rate,
    network,
    isBalance = false,
}: {
    value: CryptoToFiatAmountValue;
    network: NetworkSymbol;
    rate?: number;
    isBalance?: boolean;
}): string | null => {
    if (!value) return null;

    const transactionAmount = isBalance ? value : formatNetworkAmount(value, network);
    const fiatAmount = toFiatCurrency(transactionAmount, rate);

    return fiatAmount;
};
