import { useFormatters } from '@suite-common/formatters';
import { Text } from '@suite-native/atoms';

export type FiatAmountBadgeProps = {
    amount: string | undefined;
};

export const FiatAmountBadge = ({ amount }: FiatAmountBadgeProps) => {
    const { FiatAmountFormatter } = useFormatters();

    if (!amount) {
        return null;
    }

    return (
        <Text variant="body" color="textDefault">
            <FiatAmountFormatter value={amount} />
        </Text>
    );
};
