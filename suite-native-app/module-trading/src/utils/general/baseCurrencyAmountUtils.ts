import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    parseBaseCurrencyToFormattedCrypto,
    parseCryptoToFormattedBaseCurrency,
} from '@suite-common/wallet-utils';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

type GetBaseCurrencyAmountFromCryptoParams = {
    cryptoAmount: string | undefined;
    rate: number | undefined;
    symbol: NetworkSymbol;
    baseCurrency: BaseCurrencyCode;
    isAmountInSats: boolean;
    isBaseCurrencyInSats: boolean;
};

/**
 * Converts a crypto amount in form units (sats when enabled) to a base currency amount string
 * (sats when the base currency is BTC displayed in sats).
 */
export const getBaseCurrencyAmountFromCrypto = ({
    cryptoAmount,
    rate,
    symbol,
    baseCurrency,
    isAmountInSats,
    isBaseCurrencyInSats,
}: GetBaseCurrencyAmountFromCryptoParams): string | undefined => {
    if (!cryptoAmount || !rate) {
        return undefined;
    }

    const baseCurrencyAmount = parseCryptoToFormattedBaseCurrency({
        areSatsDisplayed: isBaseCurrencyInSats,
        baseCurrencyToSats: isAmountInSats,
        symbol,
        value: new BigNumber(cryptoAmount),
        rate,
        baseCurrencyCode: baseCurrency,
    });

    return baseCurrencyAmount === null ? undefined : new BigNumber(baseCurrencyAmount).toFixed();
};

type GetCryptoAmountFromBaseCurrencyParams = {
    baseCurrencyAmount: string | undefined;
    rate: number | undefined;
    decimals: number;
    isAmountInSats: boolean;
    isBaseCurrencyInSats: boolean;
};

/**
 * Converts a base currency amount (sats when the base currency is BTC displayed in sats) to a crypto
 * amount string in form units (sats when enabled).
 * Rounds down, so the crypto amount never exceeds the base currency amount.
 */
export const getCryptoAmountFromBaseCurrency = ({
    baseCurrencyAmount,
    rate,
    decimals,
    isAmountInSats,
    isBaseCurrencyInSats,
}: GetCryptoAmountFromBaseCurrencyParams): string | undefined => {
    if (!baseCurrencyAmount || !rate) {
        return undefined;
    }

    const cryptoAmount = parseBaseCurrencyToFormattedCrypto({
        areSatsDisplayed: isBaseCurrencyInSats,
        isCryptoInSats: isAmountInSats,
        value: new BigNumber(baseCurrencyAmount),
        rate,
        cryptoDecimals: decimals,
        roundingMode: BigNumber.ROUND_DOWN,
    });

    return cryptoAmount === null ? undefined : new BigNumber(cryptoAmount).toFixed();
};
