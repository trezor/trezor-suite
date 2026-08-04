import { A, pipe } from '@mobily/ts-belt';

import { redactNumericalSubstring } from '@suite-common/discreet-mode';
import { LANGUAGES, type Locale } from '@suite-common/suite-types';
import {
    type NetworkConfigDeps,
    type NetworkSymbol,
    isNetworkSymbol,
} from '@suite-common/wallet-config';
import { type TokenSymbol } from '@suite-common/wallet-types';
import {
    convertAmountSubunitsToUnits,
    convertAmountUnitsToSubunits,
    localizeNumber,
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

const DEFAULT_LOCALE: Locale = 'en-US';

const isLocale = (value: string): value is Locale => Object.hasOwn(LANGUAGES, value);

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
    const { locale } = config;
    const { maxDisplayedDecimals = BASE_CRYPTO_MAX_DISPLAYED_DECIMALS } = formatterContext;

    const safeLocale: Locale = isLocale(locale) ? locale : DEFAULT_LOCALE;
    const formattedValue = localizeNumber(value, safeLocale, 0, maxDisplayedDecimals);

    const [_, unformattedDecimalsPart] = value.split('.');
    const wasResultRounded = (unformattedDecimalsPart?.length ?? 0) > maxDisplayedDecimals;

    return { formattedValue, wasResultRounded };
};

const convertToSubunits = ({
    deps,
    value,
    config,
    formatterContext,
}: {
    deps: NetworkConfigDeps;
    value: string;
    config: FormatterConfig;
    formatterContext: Partial<CryptoAmountFormatterDataContext>;
}) => {
    const { symbol, isBalance = false, smallestUnitsOverride } = formatterContext;
    const { bitcoinAmountUnit } = config;
    const network = symbol && isNetworkSymbol(deps, symbol) ? deps.getNetworkConfig(symbol) : null;
    const decimals = network?.decimals ?? 0;

    const areAmountUnitsSupported = network
        ? A.includes(network.features, 'amount-unit')
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
    deps,
    value,
    config,
    formatterContext,
}: {
    deps: NetworkConfigDeps;
    value: string;
    config: FormatterConfig;
    formatterContext: Partial<CryptoAmountFormatterDataContext>;
}) => {
    const { symbol, smallestUnitsOverride, withSymbol = true } = formatterContext;

    if (!withSymbol) {
        return value;
    }

    const DisplaySymbolFormatter = prepareDisplaySymbolFormatter(deps, config);
    const formattedSymbol =
        symbol && isNetworkSymbol(deps, symbol)
            ? DisplaySymbolFormatter.format(symbol, {
                  areAmountUnitsEnabled: smallestUnitsOverride,
              })
            : symbol;

    return `${value} ${formattedSymbol}`;
};

export const prepareCryptoAmountFormatter = (deps: NetworkConfigDeps, config: FormatterConfig) =>
    makeFormatter<CryptoAmountFormatterInputValue, string, CryptoAmountFormatterDataContext>(
        (value, formatterContext, shouldRedactNumbers) =>
            pipe(
                convertToSubunits({ deps, value, config, formatterContext }),
                unitValue => localizedNumber({ value: unitValue, config, formatterContext }),
                ({ formattedValue, wasResultRounded }) =>
                    appendEllipsis({ value: formattedValue, wasResultRounded, formatterContext }),
                ellipsizedNumber =>
                    appendSymbol({ deps, value: ellipsizedNumber, config, formatterContext }),
                valueWithSymbol =>
                    shouldRedactNumbers
                        ? redactNumericalSubstring(valueWithSymbol)
                        : valueWithSymbol,
            ),
        'CryptoAmountFormatter',
    );
