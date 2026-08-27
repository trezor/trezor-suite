import { HStack, Text } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';
import { Icon } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';
import { TradeInfoRow } from '@suite-native/trading-atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const TEST_ID = '@trading/history/detail/info';

const tradeIdStyle = prepareNativeStyle(() => ({
    flexShrink: 1,
    textDecorationLine: 'underline',
}));

type TradingHistoryDetailTradeIdRowProps = {
    orderId: string;
};

export const TradingHistoryDetailTradeIdRow = ({
    orderId,
}: TradingHistoryDetailTradeIdRowProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const copyToClipboard = useCopyToClipboard();

    const handleCopyTradeId = async () => {
        await copyToClipboard(orderId, translate('generic.savedToClipboard'));
    };

    return (
        <TradeInfoRow spacing="sp40" onPress={handleCopyTradeId} testID={`${TEST_ID}/trade-id`}>
            <Text color="contentSecondary" variant="body-sm">
                <Translation id="moduleTrading.tradeHistory.detail.info.tradeId" />
            </Text>
            <HStack alignItems="center" flexShrink={1} spacing={0}>
                <Text
                    variant="body-sm"
                    numberOfLines={1}
                    ellipsizeMode="middle"
                    style={applyStyle(tradeIdStyle)}
                >
                    {orderId}
                </Text>
                <Icon name="copy" size="medium" />
            </HStack>
        </TradeInfoRow>
    );
};
