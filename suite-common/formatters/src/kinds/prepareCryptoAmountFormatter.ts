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

export type CryptoAmountFormatterInputValue = string | number | BigNumber;

export type CryptoAmountFormatterDataContext = {
    isBalance?: boolean;
    symbol?: string;
};

export const prepareCryptoAmountFormatter = (config: FormatterConfig) =>
    makeFormatter<CryptoAmountFormatterInputValue, string, never, CryptoAmountFormatterDataContext>(
        (value, dataContext) => {
            const { symbol, isBalance } = dataContext;
            const { locale, bitcoinAmountUnit } = config;

            const lowerCaseSymbol = symbol?.toLowerCase();
            const { features: networkFeatures } =
                NETWORKS.find(network => network.symbol === lowerCaseSymbol) ?? {};

            const areAmountUnitsSupported = !!networkFeatures?.includes('amount-unit');

            let formattedValue = value;

            // convert to different units if needed
            if (areAmountUnitsSupported) {
                switch (bitcoinAmountUnit) {
                    case PROTO.AmountUnit.SATOSHI: {
                        formattedValue = networkAmountToSatoshi(
                            String(value),
                            lowerCaseSymbol as NetworkSymbol,
                        );
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

            return formattedValue;
        },
    );
