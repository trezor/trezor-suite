import { useFormatters } from '@suite-common/formatters';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { Text } from '@suite-native/atoms';

export type FiatAmountBadgeProps = {
    amount: BaseCurrencyAmount | undefined;
};

export const FiatAmountBadge = ({ amount }: FiatAmountBadgeProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();

    if (amount === undefined || amount.isNaN()) {
        return null;
    }

    return (
        <Text variant="body-sm" color="contentPrimary">
            <BaseCurrencyAmountFormatter value={amount} minimumFractionDigits={2} />
        </Text>
    );
};
