import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { TradeInfoRow } from '@suite-native/trading-atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const amountStyle = prepareNativeStyle(() => ({
    flexGrow: 1,
    flexShrink: 1,
}));

type TradingHistoryDetailMinimumReceivedRowProps = {
    formattedMinimumReceived: string;
};

export const TradingHistoryDetailMinimumReceivedRow = ({
    formattedMinimumReceived,
}: TradingHistoryDetailMinimumReceivedRowProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <TradeInfoRow flexWrap="wrap">
            <Text color="contentSecondary" variant="body-sm">
                <Translation id="moduleTrading.tradeHistory.detail.info.minimumReceivedAmount" />
            </Text>
            <Text
                variant="body-sm"
                textAlign="right"

                style={applyStyle(amountStyle)}
            >
                {formattedMinimumReceived}
            </Text>
        </TradeInfoRow>
    );
};
