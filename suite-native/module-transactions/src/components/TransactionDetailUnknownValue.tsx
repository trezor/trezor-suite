import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const TransactionDetailUnknownValue = () => (
    <Text variant="body-sm" color="contentPrimary">
        <Translation id="generic.unknown" />
    </Text>
);
