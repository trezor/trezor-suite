import type { CryptoId } from 'invity-api';

import { useFormatters } from '@suite-common/formatters';
import { Text, type TextProps } from '@suite-native/atoms';

import { useTradingFiatValues } from '../../hooks/general/useTradingFiatValues';

export type CryptoToFiatValueBadgeProps = {
    amount: string | undefined;
    cryptoId: CryptoId | undefined;
    prefix?: string;
} & TextProps;

export const CryptoToFiatValueBadge = ({
    amount,
    cryptoId,
    prefix,
    ...textProps
}: CryptoToFiatValueBadgeProps) => {
    const baseCurrencyAmount = useTradingFiatValues(amount, cryptoId)?.baseCurrencyAmount;
    const { BaseCurrencyAmountFormatter } = useFormatters();

    if (!baseCurrencyAmount) {
        return null;
    }

    return (
        <Text variant="body-sm" {...textProps}>
            {prefix}
            <BaseCurrencyAmountFormatter value={baseCurrencyAmount} />
        </Text>
    );
};
