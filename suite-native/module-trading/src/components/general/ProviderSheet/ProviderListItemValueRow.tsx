import { TradingTradeType } from '@suite-common/trading';
import { HStack, Text } from '@suite-native/atoms';

import { useChangeStringsExtractor } from '../../../hooks/history/useChangeStringsExtractor';
import { CryptoToFiatValueBadge } from '../CryptoToFiatValueBadge';

export type ProviderListItemValueRowProps<T extends TradingTradeType> = {
    quote: T;
};

export const ProviderListItemValueRow = <T extends TradingTradeType>({
    quote,
}: ProviderListItemValueRowProps<T>) => {
    const { toStringValue, isToCrypto, toValue, toCurrency } = useChangeStringsExtractor(quote);

    return (
        <HStack justifyContent="space-between" alignItems="center" paddingTop="sp8">
            <Text variant="body-md" color="textDefault">
                {toStringValue}
            </Text>
            {isToCrypto && (
                <CryptoToFiatValueBadge
                    amount={toValue}
                    cryptoId={toCurrency}
                    prefix="≈ "
                    color="textSubdued"
                />
            )}
        </HStack>
    );
};
