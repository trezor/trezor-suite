import { type ReactNode } from 'react';

import { type BaseCurrencyAmount as BaseCurrencyAmountValue } from '@suite-common/wallet-types';

import { useFormattedGraphHeaderValues } from '../hooks/useFormattedGraphHeaderValues';
import { type FormatterProps } from '../types';
import { EmptyAmountText } from './EmptyAmountText';

export type FormattedBaseCurrencyAmount = {
    currencySymbol: string;
    wholeNumber: string;
    decimalNumber: string;
    isCryptoCurrency: boolean;
};

type BaseCurrencyAmountProps = FormatterProps<BaseCurrencyAmountValue | null> & {
    children: (formattedAmount: FormattedBaseCurrencyAmount) => ReactNode;
};

// Provides consistently formatted base-currency parts to a consumer-owned presentation.
export const BaseCurrencyAmount = ({ value, children }: BaseCurrencyAmountProps) => {
    const { currencySymbol, wholeNumber, decimalNumber } = useFormattedGraphHeaderValues(
        value?.toString(),
    );

    if (!value) return <EmptyAmountText />;

    const isCryptoCurrency = ['sat', 'btc'].includes(currencySymbol.toLowerCase());

    return children({
        currencySymbol,
        wholeNumber,
        decimalNumber,
        isCryptoCurrency,
    });
};
