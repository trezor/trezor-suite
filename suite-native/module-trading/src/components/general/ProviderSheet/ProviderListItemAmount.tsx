import {
    type TradingTradeType,
    useChangeStringsExtractor,
    useTradingRequestedSide,
} from '@suite-common/trading';
import { Text } from '@suite-native/atoms';

export type ProviderListItemAmountProps<T extends TradingTradeType> = {
    quote: T;
};

export const ProviderListItemAmount = <T extends TradingTradeType>({
    quote,
}: ProviderListItemAmountProps<T>) => {
    const { fromStringValue, toStringValue } = useChangeStringsExtractor(quote);
    const requestedSide = useTradingRequestedSide(quote);
    const displayValue = requestedSide === 'to' ? fromStringValue : toStringValue;

    if (!displayValue) {
        return null;
    }

    return (
        <Text variant="body-md-strong" color="contentPrimary">
            {displayValue}
        </Text>
    );
};
