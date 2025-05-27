import { A } from '@mobily/ts-belt';

import {
    NetworkSymbol,
    getNetworkOptional,
    isNetworkSymbol,
    networks,
} from '@suite-common/wallet-config';
import {
    amountToSmallestUnit,
    formatAmount,
    redactNumericalSubstring,
} from '@suite-common/wallet-utils';
import { PROTO } from '@trezor/connect';

import { makeFormatter } from '../makeFormatter';
import { FormatterConfig } from '../types';
import { prepareDisplaySymbolFormatter } from './prepareDisplaySymbolFormatter';

export type CryptoAmountFormatterInputValue = string;

export type CryptoAmountFormatterDataContext = {
    symbol: NetworkSymbol;
    withSymbol?: boolean;
    isBalance?: boolean;
    maxDisplayedDecimals?: number;
    isEllipsisAppended?: boolean;
    smallestUnitsOverride?: boolean;
};

export const BASE_CRYPTO_MAX_DISPLAYED_DECIMALS = 8;

const truncateDecimals = (value: string, maxDecimals: number, isEllipsisAppended: boolean) => {
    const parts = value.split('.');
    const [integerPart, fractionalPart] = parts;

    if (fractionalPart && fractionalPart.length > maxDecimals) {
        return `${integerPart}.${fractionalPart.slice(0, maxDecimals)}${
            isEllipsisAppended ? '…' : ''
        }`;
    }

    return value;
};

const convertToUnit = (
    value: string,
    isBalance: boolean,
    config: FormatterConfig,
    symbol?: NetworkSymbol,
    smallestUnitsOverride?: boolean,
) => {
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
        return amountToSmallestUnit(value, decimals);
    }

    // if it's not balance and sats units are disabled, values other than balances are in sats so we need to convert it to BTC
    if (
        !isBalance &&
        (bitcoinAmountUnit !== PROTO.AmountUnit.SATOSHI || !areAmountUnitsSupported)
    ) {
        return formatAmount(value, decimals ?? BASE_CRYPTO_MAX_DISPLAYED_DECIMALS);
    }

    return value;
};

const appendSymbol = (
    value: string,
    config: FormatterConfig,
    symbol: NetworkSymbol,
    areAmountUnitsEnabled?: boolean,
) => {
    const DisplaySymbolFormatter = prepareDisplaySymbolFormatter(config);

    return `${value} ${DisplaySymbolFormatter.format(symbol, { areAmountUnitsEnabled })}`;
};

export const prepareCryptoAmountFormatter = (config: FormatterConfig) =>
    makeFormatter<CryptoAmountFormatterInputValue, string, CryptoAmountFormatterDataContext>(
        (
            value,
            {
                symbol,
                isBalance = false,
                withSymbol = true,
                maxDisplayedDecimals = BASE_CRYPTO_MAX_DISPLAYED_DECIMALS,
                isEllipsisAppended = true,
                smallestUnitsOverride,
            },
            shouldRedactNumbers,
        ) => {
            const convertedValue = convertToUnit(
                value,
                isBalance,
                config,
                symbol,
                smallestUnitsOverride,
            );
            const truncatedValue = maxDisplayedDecimals
                ? truncateDecimals(convertedValue, maxDisplayedDecimals, isEllipsisAppended)
                : convertedValue;

            const formattedValue =
                withSymbol && symbol && isNetworkSymbol(symbol)
                    ? appendSymbol(truncatedValue, config, symbol, smallestUnitsOverride)
                    : truncatedValue;

            return shouldRedactNumbers ? redactNumericalSubstring(formattedValue) : formattedValue;
        },
        'CryptoAmountFormatter',
    );
