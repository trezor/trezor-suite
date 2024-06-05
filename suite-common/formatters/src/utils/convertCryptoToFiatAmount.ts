import { formatNetworkAmount, toFiatCurrency } from '@suite-common/wallet-utils';
import { NetworkSymbol } from '@suite-common/wallet-config';

type CryptoToFiatAmountValue = string | null;

export const convertCryptoToFiatAmount = ({
    value,
    rate,
    network,
}: {
    value: CryptoToFiatAmountValue;
    rate?: number;
    network: NetworkSymbol;
}): string | null => {
    if (!value) return null;

    const transactionAmount = formatNetworkAmount(value, network);
    const fiatAmount = toFiatCurrency(transactionAmount, rate);

    return fiatAmount;
};
