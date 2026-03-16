import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import {
    convertAmountUnitsToSubunits,
    formatNetworkAmount,
    fromBaseCurrencyToCryptoUnit,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

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

/**
 * @deprecated use `fromBaseCurrencyToCryptoUnit` directly
 */
export const convertFiatToCryptoAmount = ({
    amount,
    symbol,
    isAmountInSats = true,
    rate,
}: ConvertInput): BigNumber | null => {
    if (!amount) {
        return null;
    }

    const { decimals } = getNetwork(symbol);
    const cryptoAmount = fromBaseCurrencyToCryptoUnit({ fiatAmount: amount, rate });

    if (!cryptoAmount || !isAmountInSats) {
        return cryptoAmount;
    }

    return new BigNumber(convertAmountUnitsToSubunits(new BigNumber(cryptoAmount), decimals));
};
