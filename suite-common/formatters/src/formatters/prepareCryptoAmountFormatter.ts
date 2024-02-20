import { A } from '@mobily/ts-belt';

import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { amountToSatoshi, formatAmount } from '@suite-common/wallet-utils';
import { PROTO } from '@trezor/connect';

import { makeFormatter } from '../makeFormatter';
import { FormatterConfig } from '../types';
import { prepareNetworkSymbolFormatter } from './prepareNetworkSymbolFormatter';

export type CryptoAmountFormatterInputValue = string;

export type CryptoAmountFormatterDataContext = {
    symbol: NetworkSymbol;
    withSymbol?: boolean;
    isBalance?: boolean;
    maxDisplayedDecimals?: number;
    isEllipsisAppended?: boolean;
};

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

// We cannot use networks "A.includes(networks[symbol].features, 'amount-unit')" because this flag is on many coins like ETH.
// These coins will looks very bad in app because for example ETH have 18 numbers... So we hardcode enabled coins here.
const COINS_WITH_SATS = ['btc', 'test'] satisfies NetworkSymbol[];

export const prepareCryptoAmountFormatter = (config: FormatterConfig) =>
    makeFormatter<CryptoAmountFormatterInputValue, string, CryptoAmountFormatterDataContext>(
        (
            value,
            {
                symbol,
                isBalance = false,
                withSymbol = true,
                maxDisplayedDecimals = 8,
                isEllipsisAppended = true,
            },
        ) => {
            const { bitcoinAmountUnit } = config;

            const decimals = networks[symbol!]?.decimals || 0;

            // const areAmountUnitsSupported = A.includes(features, 'amount-unit');
            const areAmountUnitsSupported = A.includes(COINS_WITH_SATS, symbol);

            let formattedValue: string = value;

            // balances are not in sats, but already formatted to BTC so we need to convert it back to sats if needed
            if (
                isBalance &&
                areAmountUnitsSupported &&
                bitcoinAmountUnit === PROTO.AmountUnit.SATOSHI
            ) {
                formattedValue = amountToSatoshi(value, decimals);
            }

            // if it's not balance and sats units are disabled, values other than balances are in sats so we need to convert it to BTC
            if (
                !isBalance &&
                (bitcoinAmountUnit !== PROTO.AmountUnit.SATOSHI || !areAmountUnitsSupported)
            ) {
                formattedValue = formatAmount(value, decimals ?? 8);
            }

            if (maxDisplayedDecimals) {
                formattedValue = truncateDecimals(
                    formattedValue,
                    maxDisplayedDecimals,
                    isEllipsisAppended,
                );
            }

            if (withSymbol) {
                const NetworkSymbolFormatter = prepareNetworkSymbolFormatter(config);

                return `${formattedValue} ${NetworkSymbolFormatter.format(symbol!)}`;
            }

            return formattedValue;
        },
        'CryptoAmountFormatter',
    );
