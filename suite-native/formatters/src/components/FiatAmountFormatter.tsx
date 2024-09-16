import React from 'react';

import { TextProps } from '@suite-native/atoms';
import { useFormatters } from '@suite-common/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { isTestnet } from '@suite-common/wallet-utils';

import { FormatterProps } from '../types';
import { EmptyAmountSkeleton } from './EmptyAmountSkeleton';
import { AmountText } from './AmountText';
import { TestnetFiatAmount } from './TestnetFiatAmount';

type FiatAmountFormatterProps = FormatterProps<string | null> &
    TextProps & {
        network?: NetworkSymbol;
        isDiscreetText?: boolean;
    };

export const FiatAmountFormatter = React.memo(
    ({ network, value, isDiscreetText = true, ...textProps }: FiatAmountFormatterProps) => {
        const { FiatAmountFormatter: formatter } = useFormatters();

        if (!!network && isTestnet(network)) {
            return <TestnetFiatAmount />;
        }
        if (value === null) {
            return <EmptyAmountSkeleton />;
        }

        const formattedValue = formatter.format(value);

        return <AmountText value={formattedValue} isDiscreetText={isDiscreetText} {...textProps} />;
    },
);
