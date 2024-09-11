import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import {
    amountToSatoshi,
    formatNetworkAmount,
    fromFiatCurrency,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils/src/bigNumber';

type ConvertInput = {
    amount: string | null;
    networkSymbol: NetworkSymbol;
    isAmountInSats?: boolean;
    rate?: number;
};

export const convertCryptoToFiatAmount = ({
    amount,
    networkSymbol,
    isAmountInSats = true,
    rate,
}: ConvertInput): string | null => {
    if (!amount) {
        return null;
    }

    const networkAmount = isAmountInSats ? formatNetworkAmount(amount, networkSymbol) : amount;

    return toFiatCurrency(networkAmount, rate);
};

export const convertFiatToCryptoAmount = ({
    amount,
    networkSymbol,
    isAmountInSats = true,
    rate,
}: ConvertInput): string | null => {
    if (!amount) {
        return null;
    }

    const { decimals } = networks[networkSymbol];
    const cryptoAmount = fromFiatCurrency(amount, decimals, rate);

    if (!cryptoAmount || !isAmountInSats) {
        return cryptoAmount;
    }

    return amountToSatoshi(new BigNumber(cryptoAmount), decimals);
};
