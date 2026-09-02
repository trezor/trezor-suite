import { pipe } from '@mobily/ts-belt';

import { redactNumericalSubstring } from '@suite-common/discreet-mode';
import { LANGUAGES, type Locale } from '@suite-common/suite-types';
import {
    type NetworkSymbol,
    getNetworkOptional,
    isNetworkSymbol,
    networks,
} from '@suite-common/wallet-config';
import { type TokenSymbol } from '@suite-common/wallet-types';
import {
    convertAmountSubunitsToUnits,
    convertAmountUnitsToSubunits,
    localizeNumber,
} from '@suite-common/wallet-utils';
import { PROTO } from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { makeFormatter } from '../makeFormatter';
import { type FormatterConfig } from '../types';
import { prepareDisplaySymbolFormatter } from './prepareDisplaySymbolFormatter';
import { formatCompactCryptoAmount } from '../utils/formatCompactCryptoAmount';
import { truncateCryptoAmount } from '../utils/truncateCryptoAmount';

export type CryptoAmountFormatterInputValue = string;

export type CryptoAmountFormatterFormatStyle = 'exact' | 'compact-balance';

// Tokens with this many decimals (e.g. stablecoins like USDC/USDT) are rendered money-like
// (two decimals) in the compact format.
const MONEY_LIKE_TOKEN_DECIMALS = 6;

export type CryptoAmountFormatterDataContext = {
    symbol: NetworkSymbol | TokenSymbol;
    withSymbol?: boolean;
    isBalance?: boolean; // This enables the display in Sats if selected in settings // Todo: fix WTF naming
    maxDisplayedDecimals?: number;
    isEllipsisAppended?: boolean;
    smallestUnitsOverride?: boolean;
    formatStyle?: CryptoAmountFormatterFormatStyle;
    tokenDecimals?: number;
};

export const BASE_CRYPTO_MAX_DISPLAYED_DECIMALS = 8;

const DEFAULT_LOCALE: Locale = 'en-US';

const isLocale = (value: string): value is Locale => Object.hasOwn(LANGUAGES, value);

const getSafeLocale = (locale: string): Locale => (isLocale(locale) ? locale : DEFAULT_LOCALE);

const appendEllipsis = ({
    value,
    wasResultRounded,
    formatterContext,
}: {
    value: string;
    wasResultRounded: boolean;
    formatterContext: Partial<CryptoAmountFormatterDataContext>;
}): string => {
    const { isEllipsisAppended = true } = formatterContext;

    if (wasResultRounded && isEllipsisAppended) {
        return `${value}…`;
    }

    return value;
};

const formatExactCryptoAmount = ({
    value,
    locale,
    formatterContext,
}: {
    value: string;
    locale: Locale;
    formatterContext: Partial<CryptoAmountFormatterDataContext>;
}): string => {
    const { maxDisplayedDecimals = BASE_CRYPTO_MAX_DISPLAYED_DECIMALS } = formatterContext;
    const cryptoAmount = new BigNumber(value);
    const truncatedCryptoAmount = cryptoAmount.isFinite()
        ? truncateCryptoAmount(cryptoAmount, maxDisplayedDecimals)
        : cryptoAmount;

    const formattedValue = localizeNumber(truncatedCryptoAmount, locale, 0, maxDisplayedDecimals);

    const wasResultRounded =
        cryptoAmount.isFinite() && !cryptoAmount.isEqualTo(truncatedCryptoAmount);

    return appendEllipsis({ value: formattedValue, wasResultRounded, formatterContext });
};

type NormalizedCryptoAmount = {
    value: string;
    areSubunitsDisplayed: boolean;
};

const normalizeCryptoAmountForDisplay = ({
    value,
    config,
    formatterContext,
}: {
    value: string;
    config: FormatterConfig;
    formatterContext: Partial<CryptoAmountFormatterDataContext>;
}): NormalizedCryptoAmount => {
    const { symbol, isBalance = false, smallestUnitsOverride } = formatterContext;
    const { bitcoinAmountUnit } = config;
    const decimals = getNetworkOptional(symbol)?.decimals ?? 0;

    const areAmountUnitsSupported =
        symbol && isNetworkSymbol(symbol)
            ? networks[symbol]?.features.some(feature => feature === 'amount-unit') === true
            : false;

    if (smallestUnitsOverride === false) {
        return { value, areSubunitsDisplayed: false };
    }

    if (
        smallestUnitsOverride === true ||
        (isBalance && areAmountUnitsSupported && bitcoinAmountUnit === PROTO.AmountUnit.SATOSHI)
    ) {
        return {
            value: convertAmountUnitsToSubunits(value, decimals),
            areSubunitsDisplayed: true,
        };
    }

    // Non-balance values arrive in the smallest subunit, so convert them to main units
    // unless subunit display (e.g. sats) is enabled.
    if (
        !isBalance &&
        (bitcoinAmountUnit !== PROTO.AmountUnit.SATOSHI || !areAmountUnitsSupported)
    ) {
        return {
            value: convertAmountSubunitsToUnits(value, decimals),
            areSubunitsDisplayed: false,
        };
    }

    // A balance reaching this point is already in main units; anything else was kept in sats by the
    // branch above.
    return { value, areSubunitsDisplayed: !isBalance };
};

const formatCryptoAmountForDisplay = ({
    value,
    config,
    formatterContext,
    areSubunitsDisplayed,
}: {
    value: string;
    config: FormatterConfig;
    formatterContext: Partial<CryptoAmountFormatterDataContext>;
    areSubunitsDisplayed: boolean;
}): string => {
    const { formatStyle = 'exact', tokenDecimals } = formatterContext;
    const locale = getSafeLocale(config.locale);

    switch (formatStyle) {
        case 'compact-balance':
            return formatCompactCryptoAmount({
                value,
                locale,
                isMoneyLike: tokenDecimals === MONEY_LIKE_TOKEN_DECIMALS,
                areSubunitsDisplayed,
            });
        case 'exact':
            return formatExactCryptoAmount({ value, locale, formatterContext });
        default:
            return exhaustive(formatStyle);
    }
};

const appendSymbol = ({
    value,
    config,
    formatterContext,
}: {
    value: string;
    config: FormatterConfig;
    formatterContext: Partial<CryptoAmountFormatterDataContext>;
}) => {
    const { symbol, smallestUnitsOverride, withSymbol = true } = formatterContext;

    if (!withSymbol) {
        return value;
    }

    const DisplaySymbolFormatter = prepareDisplaySymbolFormatter(config);
    const formattedSymbol =
        symbol && isNetworkSymbol(symbol)
            ? DisplaySymbolFormatter.format(symbol, {
                  areAmountUnitsEnabled: smallestUnitsOverride,
              })
            : symbol;

    return `${value} ${formattedSymbol}`;
};

export const prepareCryptoAmountFormatter = (config: FormatterConfig) =>
    makeFormatter<CryptoAmountFormatterInputValue, string, CryptoAmountFormatterDataContext>(
        (value, formatterContext, shouldRedactNumbers) =>
            pipe(
                normalizeCryptoAmountForDisplay({ value, config, formatterContext }),
                ({ value: normalizedAmount, areSubunitsDisplayed }) =>
                    formatCryptoAmountForDisplay({
                        value: normalizedAmount,
                        config,
                        formatterContext,
                        areSubunitsDisplayed,
                    }),
                formattedAmount =>
                    appendSymbol({ value: formattedAmount, config, formatterContext }),
                valueWithSymbol =>
                    shouldRedactNumbers
                        ? redactNumericalSubstring(valueWithSymbol)
                        : valueWithSymbol,
            ),
        'CryptoAmountFormatter',
    );
