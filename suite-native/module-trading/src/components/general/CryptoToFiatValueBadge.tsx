import type { CryptoId } from 'invity-api';

import { useFormatters } from '@suite-common/formatters';
import { Text, type TextProps } from '@suite-native/atoms';

import { useTradingFiatValues } from '../../hooks/general/useTradingFiatValues';

export type CryptoToFiatValueBadgeProps = {
    amount: string | undefined;
    cryptoId: CryptoId | undefined;
} & TextProps;

export const CryptoToFiatValueBadge = ({
    amount,
    cryptoId,
    ...textProps
}: CryptoToFiatValueBadgeProps) => {
    const baseCurrencyAmount = useTradingFiatValues(amount, cryptoId)?.baseCurrencyAmount;
    const { BaseCurrencyAmountFormatter } = useFormatters();

    if (!baseCurrencyAmount) {
        return null;
    }

    return (
        <Text variant="body-sm" {...textProps}>
            <BaseCurrencyAmountFormatter value={baseCurrencyAmount} />
        </Text>
    );
};
