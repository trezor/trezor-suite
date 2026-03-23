import type { TradingTradeType } from '@suite-common/trading';
import { HStack, Text } from '@suite-native/atoms';

import { useChangeStringsExtractor } from '../../../hooks/history/useChangeStringsExtractor';

export type ProviderListItemValueRowProps<T extends TradingTradeType> = {
    quote: T;
};

export const ProviderListItemValueRow = <T extends TradingTradeType>({
    quote,
}: ProviderListItemValueRowProps<T>) => {
    const { formattedRate } = useChangeStringsExtractor(quote);

    if (!formattedRate) {
        return null;
    }

    return (
        <HStack justifyContent="space-between" alignItems="center" paddingTop="sp8">
            <Text variant="body-md" color="textDefault">
                {formattedRate}
            </Text>
        </HStack>
    );
};
