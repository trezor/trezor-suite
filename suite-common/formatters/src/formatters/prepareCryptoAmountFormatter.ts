import BigNumber from 'bignumber.js';

import { networksCompatibility as NETWORKS, NetworkSymbol } from '@suite-common/wallet-config';
import {
    localizeNumber,
    networkAmountToSatoshi,
    formatCoinBalance,
} from '@suite-common/wallet-utils';
import { PROTO } from '@trezor/connect';

import { makeFormatter } from '../makeFormatter';
import { FormatterConfig } from '../types';
import { prepareCurrencySymbolFormatter } from './prepareCurrencySymbolFormatter';

export type CryptoAmountFormatterInputValue = string | number | BigNumber;

export type CryptoAmountFormatterDataContext = {
    isBalance?: boolean;
    symbol?: NetworkSymbol;
    withSymbol?: boolean;
};

export const prepareCryptoAmountFormatter = (config: FormatterConfig) =>
    makeFormatter<CryptoAmountFormatterInputValue, string, CryptoAmountFormatterDataContext>(
        (value, dataContext) => {
            const { symbol, isBalance, withSymbol } = dataContext;
            const { locale, bitcoinAmountUnit } = config;

            const CurrencySymbolFormatter = prepareCurrencySymbolFormatter(config);

            const { features: networkFeatures } =
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
                formattedValue = localizeNumber(formattedValue, locale);
            }

            if (withSymbol && symbol) {
                return `${formattedValue} ${CurrencySymbolFormatter.format(symbol)}`;
            }

            return formattedValue;
        },
    );
