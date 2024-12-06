import { getNetwork, type NetworkSymbol } from '@suite-common/wallet-config';
import {
    amountToSmallestUnit,
    formatNetworkAmount,
    fromFiatCurrency,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils/src/bigNumber';

type ConvertInput = {
    amount: string | null;
    symbol: NetworkSymbol;
    isAmountInSats?: boolean;
    rate?: number;
};

export const convertCryptoToFiatAmount = ({
    amount,
    symbol,
    isAmountInSats = true,
    rate,
}: ConvertInput): string | null => {
    if (!amount) {
        return null;
    }

    const networkAmount = isAmountInSats ? formatNetworkAmount(amount, symbol) : amount;

    return toFiatCurrency(networkAmount, rate);
};

export const convertFiatToCryptoAmount = ({
    amount,
    symbol,
    isAmountInSats = true,
    rate,
}: ConvertInput): string | null => {
    if (!amount) {
        return null;
    }

    const { decimals } = getNetwork(symbol);
    const cryptoAmount = fromFiatCurrency(amount, decimals, rate);

    if (!cryptoAmount || !isAmountInSats) {
        return cryptoAmount;
    }

    return amountToSmallestUnit(new BigNumber(cryptoAmount), decimals);
};
