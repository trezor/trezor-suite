import { SignValue } from '@suite-common/suite-types';

import { Formatter } from './makeFormatter';

export type FormatterConfig = {
    locale: string;
    areSatsDisplayed: boolean;
};

export type CryptoAmountFormatterInputType = {
    amount?: string | number;
    symbol?: string;
    isBalance?: boolean;
    signValue?: SignValue;
};

export type CryptoAmountStructuredOutput = {
    formattedSignValue?: SignValue;
    formattedValue: string;
    formattedSymbol: string;
};

export type CryptoAmountFormatterOutputType = string | CryptoAmountStructuredOutput;

export type Formatters = {
    cryptoAmountFormatter: Formatter<
        CryptoAmountFormatterInputType,
        CryptoAmountFormatterOutputType,
        string
    >;
};
