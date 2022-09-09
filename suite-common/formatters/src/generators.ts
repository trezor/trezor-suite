import { networksCompatibility as NETWORKS, NetworkSymbol } from '@suite-common/wallet-config';
import {
    localizeNumber,
    networkAmountToSatoshi,
    formatCoinBalance,
} from '@suite-common/wallet-utils';

import { makeFormatter } from './makeFormatter';
import { FormatterConfig } from './types';

export const prepareCryptoAmountFormatter = (config: FormatterConfig) =>
    makeFormatter(({ value, symbol }: { value: string | number | undefined; symbol: string }) => {
        const { locale, areSatsDisplayed } = config;

        const lowerCaseSymbol = symbol?.toLowerCase();
        const { features: networkFeatures, testnet: isTestnet } =
            NETWORKS.find(network => network.symbol === lowerCaseSymbol) ?? {};

        const areSatsSupported = !!networkFeatures?.includes('amount-unit');

        let formattedValue = value;
        let formattedSymbol = symbol?.toUpperCase();

        const isSatoshis = areSatsSupported && areSatsDisplayed;

        // convert to satoshis if needed
        if (isSatoshis) {
            formattedValue = networkAmountToSatoshi(
                String(value),
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
    });
