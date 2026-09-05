import { type Locale } from '@suite-common/suite-types';
import { localizeNumber } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { truncateCryptoAmount } from './truncateCryptoAmount';

const COMPACT_CRYPTO_DUST_LIMIT = new BigNumber('0.00001');
const COMPACT_CRYPTO_MONEY_DUST_LIMIT = new BigNumber('0.01');
const COMPACT_CRYPTO_MILLION_LIMIT = new BigNumber(1_000_000);
const COMPACT_CRYPTO_BILLION_LIMIT = new BigNumber(1_000_000_000);

type CompactCryptoAmountScale = {
    divisor: BigNumber;
    suffix: 'M' | 'B';
};

const getCompactCryptoAmountScale = (absoluteValue: BigNumber): CompactCryptoAmountScale | null => {
    if (absoluteValue.gte(COMPACT_CRYPTO_BILLION_LIMIT)) {
        return {
            divisor: COMPACT_CRYPTO_BILLION_LIMIT,
            suffix: 'B',
        };
    }

    if (absoluteValue.gte(COMPACT_CRYPTO_MILLION_LIMIT)) {
        return {
            divisor: COMPACT_CRYPTO_MILLION_LIMIT,
            suffix: 'M',
        };
    }

    return null;
};
type FormatTruncatedCryptoAmountParams = {
    value: BigNumber;
    locale: Locale;
    minDecimalPlaces?: number;
    decimalPlaces: number;
};

const formatTruncatedCryptoAmount = ({
    value,
    locale,
    minDecimalPlaces = 0,
    decimalPlaces,
}: FormatTruncatedCryptoAmountParams): string => {
    const truncatedValue = truncateCryptoAmount(value, decimalPlaces);

    return localizeNumber(truncatedValue.toFixed(), locale, minDecimalPlaces, decimalPlaces);
};
type FormatCompactDustLimitParams = {
    limit: BigNumber;
    locale: Locale;
    decimalPlaces: number;
};

const formatCompactDustLimit = ({
    limit,
    locale,
    decimalPlaces,
}: FormatCompactDustLimitParams): string =>
    `<${localizeNumber(limit.toFixed(), locale, decimalPlaces, decimalPlaces)}`;
type FormatCompactCryptoAmountParams = {
    value: string;
    locale: Locale;
    isMoneyLike?: boolean;
    /**
     * Amounts shown in the smallest unit, such as sats. A subunit cannot be divided, so there are
     * no decimals to display, no dust to hide behind a limit and nothing gained by abbreviating a
     * unit the user deliberately switched to.
     */
    areSubunitsDisplayed?: boolean;
};

export const formatCompactCryptoAmount = ({
    value,
    locale,
    // Money-like values (e.g. tokens with 6 decimals such as stablecoins) are rendered with
    // two decimals to resemble fiat, with a higher `<0.01` dust threshold.
    isMoneyLike = false,
    areSubunitsDisplayed = false,
}: FormatCompactCryptoAmountParams): string => {
    const cryptoAmount = new BigNumber(value);
    const absoluteCryptoAmount = cryptoAmount.abs();

    if (cryptoAmount.isZero()) {
        return '0';
    }

    if (areSubunitsDisplayed) {
        return formatTruncatedCryptoAmount({ value: cryptoAmount, locale, decimalPlaces: 0 });
    }

    if (isMoneyLike && absoluteCryptoAmount.lt(COMPACT_CRYPTO_MONEY_DUST_LIMIT)) {
        return formatCompactDustLimit({
            limit: COMPACT_CRYPTO_MONEY_DUST_LIMIT,
            locale,
            decimalPlaces: 2,
        });
    }

    if (!isMoneyLike && absoluteCryptoAmount.lt(COMPACT_CRYPTO_DUST_LIMIT)) {
        return formatCompactDustLimit({
            limit: COMPACT_CRYPTO_DUST_LIMIT,
            locale,
            decimalPlaces: 5,
        });
    }

    const compactScale = getCompactCryptoAmountScale(absoluteCryptoAmount);

    if (compactScale !== null) {
        const compactValue = cryptoAmount.dividedBy(compactScale.divisor);
        const formattedCompactValue = formatTruncatedCryptoAmount({
            value: compactValue,
            locale,
            minDecimalPlaces: 2,
            decimalPlaces: 2,
        });

        return `${formattedCompactValue}${compactScale.suffix}`;
    }

    const isBelowOne = absoluteCryptoAmount.lt(1);
    const decimalPlaces = isMoneyLike || !isBelowOne ? 2 : 5;
    const minDecimalPlaces = isMoneyLike || !isBelowOne ? 2 : 0;

    return formatTruncatedCryptoAmount({
        value: cryptoAmount,
        locale,
        minDecimalPlaces,
        decimalPlaces,
    });
};
