import { HStack, Text } from '@suite-native/atoms';

import { useBaseCurrencyAmountPlaceholder } from '../../hooks/general/useBaseCurrencyAmountPlaceholder';

// mirrors the empty state of TradingBaseCurrencyAmountInput
export const TradingBaseCurrencyAmountPlaceholder = () => {
    const { baseCurrencyLabel, placeholder } = useBaseCurrencyAmountPlaceholder();

    return (
        <HStack spacing="sp2" alignItems="center">
            <Text variant="body-sm" color="contentDisabled">
                {baseCurrencyLabel}
            </Text>
            <Text variant="body-sm" color="contentDisabled">
                {placeholder}
            </Text>
        </HStack>
    );
};
