import BigNumber from 'bignumber.js';
import { G } from '@mobily/ts-belt';

import { networksCompatibility as NETWORKS, NetworkSymbol } from '@suite-common/wallet-config';
import {
    localizeNumber,
    networkAmountToSatoshi,
    formatCoinBalance,
    formatAmount,
} from '@suite-common/wallet-utils';
import { PROTO } from '@trezor/connect';

import { makeFormatter } from '../makeFormatter';
import { FormatterConfig } from '../types';
import { prepareNetworkSymbolFormatter } from './prepareNetworkSymbolFormatter';

export type CryptoAmountFormatterInputValue = string | number | BigNumber;

export type CryptoAmountFormatterDataContext = {
    symbol?: NetworkSymbol;
    withSymbol?: boolean;
    isBalance?: boolean;
};

export const prepareCryptoAmountFormatter = (config: FormatterConfig) =>
    makeFormatter<CryptoAmountFormatterInputValue, string, CryptoAmountFormatterDataContext>(
        (value, { symbol, isBalance = false, withSymbol = true }) => {
            const { locale, bitcoinAmountUnit } = config;

            const { features: networkFeatures, decimals } =
                NETWORKS.find(network => network.symbol === symbol) ?? {};

            const areAmountUnitsSupported = !!networkFeatures?.includes('amount-unit');

            let formattedValue = value;

            // convert to different units if needed
            if (symbol && areAmountUnitsSupported) {
                switch (bitcoinAmountUnit) {
                    case PROTO.AmountUnit.SATOSHI: {
                        formattedValue = networkAmountToSatoshi(String(value), symbol);
                        break;
                    }
                    default:
                }
            }

            // format truncation + locale (used for balances) or just locale
            if (isBalance) {
                formattedValue = formatCoinBalance(String(formattedValue), locale);
            } else {
                const shouldBeConvertedFromSats = G.isString(value) && symbol;
                formattedValue = shouldBeConvertedFromSats
                    ? // TODO pouzit jenom formatAmount funkci?
                      formatAmount(value, decimals ?? 8)
                    : localizeNumber(formattedValue, locale, 0, decimals);
            }

            if (withSymbol && symbol) {
                const NetworkSymbolFormatter = prepareNetworkSymbolFormatter(config);
                return `${formattedValue} ${NetworkSymbolFormatter.format(symbol)}`;
            }

            return formattedValue;
        },
    );
