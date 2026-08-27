import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { TradeInfoRow } from '@suite-native/trading-atoms';

type TradingHistoryDetailMinimumReceivedRowProps = {
    formattedMinimumReceived: string;
};

export const TradingHistoryDetailMinimumReceivedRow = ({
    formattedMinimumReceived,
}: TradingHistoryDetailMinimumReceivedRowProps) => (
    <TradeInfoRow>
        <Text color="contentSecondary" variant="body-sm">
            <Translation id="moduleTrading.tradeHistory.detail.info.minimumReceivedAmount" />
        </Text>
        <Text variant="body-sm">{formattedMinimumReceived}</Text>
    </TradeInfoRow>
);
