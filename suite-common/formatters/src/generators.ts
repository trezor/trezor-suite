import { networksCompatibility as NETWORKS, NetworkSymbol } from '@suite-common/wallet-config';
import {
    localizeNumber,
    networkAmountToSatoshi,
    formatCoinBalance,
} from '@suite-common/wallet-utils';
import { isSignValuePositive } from '@suite-common/suite-utils';

import { makeFormatter } from './makeFormatter';
import {
    CryptoAmountFormatterInputType,
    CryptoAmountFormatterOutputType,
    CryptoAmountStructuredOutput,
    FormatterConfig,
} from './types';

export const prepareCryptoAmountFormatter = (config: FormatterConfig) =>
    makeFormatter<CryptoAmountFormatterInputType, CryptoAmountFormatterOutputType>(
        (value, suggestions) => {
            const { amount, symbol, isBalance, signValue } = value;
            const { locale, areSatsDisplayed } = config;

            const lowerCaseSymbol = symbol?.toLowerCase();
            const { features: networkFeatures, testnet: isTestnet } =
                NETWORKS.find(network => network.symbol === lowerCaseSymbol) ?? {};

            const areSatsSupported = !!networkFeatures?.includes('amount-unit');

            let formattedValue = amount;
            let formattedSymbol = symbol?.toUpperCase();

            const isSatoshis = areSatsSupported && areSatsDisplayed;

            // convert to satoshis if needed
            if (isSatoshis) {
                formattedValue = networkAmountToSatoshi(
                    String(amount),
                    lowerCaseSymbol as NetworkSymbol,
                );

                formattedSymbol = isTestnet ? `sat ${symbol?.toUpperCase()}` : 'sat';
            }

            // format truncation + locale (used for balances) or just locale
            if (isBalance) {
                formattedValue = formatCoinBalance(String(formattedValue), locale);
            } else {
                formattedValue = localizeNumber(Number(formattedValue), locale);
            }

            if (suggestions.includes('primitive')) {
                return formattedValue;
            }

            if (suggestions.includes('structured')) {
                return {
                    formattedSignValue: signValue,
                    formattedValue,
                    formattedSymbol,
                } as CryptoAmountStructuredOutput;
            }

            const displayedSignValue = signValue
                ? `${isSignValuePositive(signValue) ? '+' : '-'}`
                : '';

            return `${displayedSignValue} ${formattedValue} ${formattedSymbol}`;
        },
    );
