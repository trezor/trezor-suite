import type { CryptoId } from 'invity-api';

import { useFormatters } from '@suite-common/formatters';
import { Text } from '@suite-native/atoms';

import { useTradingFiatValues } from '../../hooks/general/useTradingFiatValues';

export type CryptoToFiatValueBadgeProps = {
    amount: string | undefined;
    cryptoId: CryptoId | undefined;
    prefix?: string;
};

export const CryptoToFiatValueBadge = ({
    amount,
    cryptoId,
    prefix,
}: CryptoToFiatValueBadgeProps) => {
    const baseCurrencyAmount = useTradingFiatValues(amount, cryptoId)?.baseCurrencyAmount;
    const { BaseCurrencyAmountFormatter } = useFormatters();

    if (!baseCurrencyAmount) {
        return null;
    }

    return (
        <Text variant="body-sm">
            {prefix}
            <BaseCurrencyAmountFormatter value={baseCurrencyAmount} />
        </Text>
    );
};
