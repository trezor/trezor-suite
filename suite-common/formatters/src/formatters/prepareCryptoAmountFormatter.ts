import { A, pipe } from '@mobily/ts-belt';

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
    redactNumericalSubstring,
} from '@suite-common/wallet-utils';
import { PROTO } from '@trezor/connect';

import { makeFormatter } from '../makeFormatter';
import { type FormatterConfig } from '../types';
import { prepareDisplaySymbolFormatter } from './prepareDisplaySymbolFormatter';

export type CryptoAmountFormatterInputValue = string;

export type CryptoAmountFormatterDataContext = {
    symbol: NetworkSymbol | TokenSymbol;
    withSymbol?: boolean;
    isBalance?: boolean; // This enables the display in Sats if selected in settings // Todo: fix WTF naming
    maxDisplayedDecimals?: number;
    isEllipsisAppended?: boolean;
    smallestUnitsOverride?: boolean;
};

export const BASE_CRYPTO_MAX_DISPLAYED_DECIMALS = 8;

const appendEllipsis = ({
    value,
    wasResultRounded,
    formatterContext,
}: {
    value: string;
    wasResultRounded: boolean;
    formatterContext: Partial<CryptoAmountFormatterDataContext>;
}) => {
    const { isEllipsisAppended = true } = formatterContext;

    if (wasResultRounded && isEllipsisAppended) {
        return `${value}…`;
    }

    return value;
};

const localizedNumber = ({
    value,
    config,
    formatterContext,
}: {
    value: string;
    config: FormatterConfig;
    formatterContext: Partial<CryptoAmountFormatterDataContext>;
}) => {
    const { intl } = config;
    const { maxDisplayedDecimals = BASE_CRYPTO_MAX_DISPLAYED_DECIMALS } = formatterContext;

    const formattedValue = intl.formatNumber(Number(value), {
        maximumFractionDigits: maxDisplayedDecimals,
    });

    const [_, unformattedDecimalsPart] = value.split('.');
    const wasResultRounded = (unformattedDecimalsPart?.length ?? 0) > maxDisplayedDecimals;

    return { formattedValue, wasResultRounded };
};

const convertToSubunits = ({
    value,
    config,
    formatterContext,
}: {
    value: string;
    config: FormatterConfig;
    formatterContext: Partial<CryptoAmountFormatterDataContext>;
}) => {
    const { symbol, isBalance = false, smallestUnitsOverride } = formatterContext;
    const { bitcoinAmountUnit } = config;
    const decimals = getNetworkOptional(symbol)?.decimals ?? 0;

    const areAmountUnitsSupported =
        symbol && isNetworkSymbol(symbol)
            ? A.includes(networks[symbol]?.features, 'amount-unit')
            : undefined;

    if (smallestUnitsOverride === false) {
        return value;
    }

    if (
        smallestUnitsOverride === true ||
        (isBalance && areAmountUnitsSupported && bitcoinAmountUnit === PROTO.AmountUnit.SATOSHI)
    ) {
        return convertAmountUnitsToSubunits(value, decimals);
    }

    // if it's not balance and sats units are disabled, values other than balances are in sats so we need to convert it to BTC
    if (
        !isBalance &&
        (bitcoinAmountUnit !== PROTO.AmountUnit.SATOSHI || !areAmountUnitsSupported)
    ) {
        return convertAmountSubunitsToUnits(value, decimals ?? BASE_CRYPTO_MAX_DISPLAYED_DECIMALS);
    }

    return value;
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
                convertToSubunits({ value, config, formatterContext }),
                unitValue => localizedNumber({ value: unitValue, config, formatterContext }),
                ({ formattedValue, wasResultRounded }) =>
                    appendEllipsis({ value: formattedValue, wasResultRounded, formatterContext }),
                ellipsizedNumber =>
                    appendSymbol({ value: ellipsizedNumber, config, formatterContext }),
                valueWithSymbol =>
                    shouldRedactNumbers
                        ? redactNumericalSubstring(valueWithSymbol)
                        : valueWithSymbol,
            ),
        'CryptoAmountFormatter',
    );
