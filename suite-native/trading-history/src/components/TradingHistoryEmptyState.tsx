import { Box, Button, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { TradingHistoryEmptyStateSvg } from './TradingHistoryEmptyStateSvg';

type TradingHistoryEmptyStateProps = {
    onBackToTradeForm: () => void;
};

export const TradingHistoryEmptyState = ({ onBackToTradeForm }: TradingHistoryEmptyStateProps) => (
    <VStack flex={1} justifyContent="space-between" paddingHorizontal="sp16">
        <Box flex={1} alignItems="center" justifyContent="center">
            <TradingHistoryEmptyStateSvg testID="@trading/history/empty-state/illustration" />
        </Box>
        <VStack spacing="sp32">
            <VStack spacing="sp12">
                <Text variant="headline-md">
                    <Translation id="moduleTrading.tradeHistory.emptyState.title" />
                </Text>
                <Text color="contentSecondary">
                    <Translation id="moduleTrading.tradeHistory.emptyState.description" />
                </Text>
            </VStack>
            <Button
                isFullWidth
                onPress={onBackToTradeForm}
                testID="@trading/history/empty-state/back-button"
            >
                <Translation id="moduleTrading.tradeHistory.emptyState.button" />
            </Button>
        </VStack>
    </VStack>
);
