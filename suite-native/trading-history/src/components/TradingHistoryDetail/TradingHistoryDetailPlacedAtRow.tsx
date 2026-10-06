import { useFormatters } from '@suite-common/formatters';
import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { TradeInfoRow } from '@suite-native/trading-atoms';

type TradingHistoryDetailPlacedAtRowProps = {
    placedAt: Date;
};

export const TradingHistoryDetailPlacedAtRow = ({
    placedAt,
}: TradingHistoryDetailPlacedAtRowProps) => {
    const { DateTimeFormatter } = useFormatters();

    return (
        <TradeInfoRow>
            <Text color="contentSecondary" variant="body-sm">
                <Translation id="moduleTrading.tradeHistory.detail.info.placed" />
            </Text>
            <Text variant="body-sm">
                <DateTimeFormatter value={placedAt} dateStyle="long" />
            </Text>
        </TradeInfoRow>
    );
};
