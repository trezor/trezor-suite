import { type TradingType } from '@suite-common/trading';
import { Button, Card, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { exhaustive } from '@trezor/type-utils';

type TitleProps = {
    tradeType: TradingType;
};

type TradeTypeEmptyStateProps = {
    tradeType: TradingType;
    onShowAllTrades: () => void;
};

const cardStyle = prepareNativeStyle(({ spacings }) => ({
    padding: spacings.sp24,
}));

const Title = ({ tradeType }: TitleProps) => {
    switch (tradeType) {
        case 'exchange':
            return <Translation id="moduleTrading.tradeHistory.filteredEmptyState.exchange" />;
        case 'buy':
            return <Translation id="moduleTrading.tradeHistory.filteredEmptyState.buy" />;
        case 'sell':
            return <Translation id="moduleTrading.tradeHistory.filteredEmptyState.sell" />;
        default:
            return exhaustive(tradeType);
    }
};

export const TradeTypeEmptyState = ({ tradeType, onShowAllTrades }: TradeTypeEmptyStateProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Card style={applyStyle(cardStyle)}>
            <VStack spacing="sp20">
                <Text variant="headline-sm" textAlign="center">
                    <Title tradeType={tradeType} />
                </Text>
                <Button
                    intent="neutral"
                    priority="secondary"
                    isFullWidth
                    onPress={onShowAllTrades}
                    testID="@trading/history/show-all-trades"
                >
                    <Translation id="moduleTrading.tradeHistory.filteredEmptyState.showAll" />
                </Button>
            </VStack>
        </Card>
    );
};
