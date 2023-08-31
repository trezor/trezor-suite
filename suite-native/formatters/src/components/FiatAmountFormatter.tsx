import { TextProps } from '@suite-native/atoms';
import { useFormatters } from '@suite-common/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { isTestnet } from '@suite-common/wallet-utils';

import { FormatterProps } from '../types';
import { EmptyAmountText } from './EmptyAmountText';
import { AmountText } from './AmountText';

type FiatAmountFormatterProps = FormatterProps<string | null> &
    TextProps & {
        network?: NetworkSymbol;
        isDiscreetText?: boolean;
    };

export const FiatAmountFormatter = ({
    network,
    value,
    isDiscreetText = true,
    ...textProps
}: FiatAmountFormatterProps) => {
    const { FiatAmountFormatter: formatter } = useFormatters();

    const isTestnetValue = !!network && isTestnet(network);

    if (!value || isTestnetValue) return <EmptyAmountText />;

    const formattedValue = formatter.format(value);

    return <AmountText value={formattedValue} isDiscreetText={isDiscreetText} {...textProps} />;
};
