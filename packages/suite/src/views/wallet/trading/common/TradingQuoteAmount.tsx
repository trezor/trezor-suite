import {
    type TradingTradeType,
    useChangeStringsExtractor,
    useTradingRequestedSide,
} from '@suite-common/trading';
import { Text } from '@trezor/components';

type TradingQuoteAmountProps = {
    quote: TradingTradeType;
};

export const TradingQuoteAmount = ({ quote }: TradingQuoteAmountProps) => {
    const { fromStringValue, toStringValue } = useChangeStringsExtractor(quote);
    const requestedSide = useTradingRequestedSide(quote);

    const displayValue = requestedSide === 'to' ? fromStringValue : toStringValue;

    if (!displayValue) {
        return null;
    }

    return (
        <Text typographyStyle="body-sm-strong" data-testid="@trading/quote/amount">
            {displayValue}
        </Text>
    );
};
