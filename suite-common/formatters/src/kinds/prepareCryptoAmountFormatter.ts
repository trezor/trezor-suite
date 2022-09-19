import BigNumber from 'bignumber.js';

import { networksCompatibility as NETWORKS, NetworkSymbol } from '@suite-common/wallet-config';
import {
    localizeNumber,
    networkAmountToSatoshi,
    formatCoinBalance,
} from '@suite-common/wallet-utils';
import { isSignValuePositive } from '@suite-common/suite-utils';
import { SignValue } from '@suite-common/suite-types/libDev/src';

import { makeFormatter } from '../makeFormatter';
import { FormatterConfig } from '../types';

export type CryptoAmountFormatterInputValue = string | number | BigNumber;

export type CryptoAmountFormatterDataContext = {
    symbol?: string;
    isBalance?: boolean;
    signValue?: SignValue;
};

export type CryptoAmountStructuredOutput = {
    formattedSignValue?: SignValue;
    formattedValue: string;
    formattedSymbol: string;
};

export type CryptoAmountFormatterOutputType =
    | string
    | CryptoAmountStructuredOutput
    | CryptoAmountFormatterInputValue;

export const prepareCryptoAmountFormatter = (config: FormatterConfig) =>
    makeFormatter<
        CryptoAmountFormatterInputValue,
        CryptoAmountFormatterOutputType,
        string,
        CryptoAmountStructuredOutput,
        CryptoAmountFormatterDataContext
    >((value, dataContext, outputFormat) => {
        const { symbol, isBalance, signValue } = dataContext;
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
            formattedValue = localizeNumber(formattedValue, locale);
        }

        switch (outputFormat) {
            case 'primitive':
                return formattedValue as string;
            case 'structured': {
                return {
                    formattedSignValue: signValue,
                    formattedValue,
                    formattedSymbol,
                } as CryptoAmountStructuredOutput;
            }
            case 'default': {
                const displayedSignValue = signValue
                    ? `${isSignValuePositive(signValue) ? '+' : '-'}`
                    : '';

                return `${displayedSignValue} ${formattedValue} ${formattedSymbol}`;
            }
            default:
        }

        return value;
    });
