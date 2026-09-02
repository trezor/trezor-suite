import { memo } from 'react';
import { FadeIn } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { isCrossChainTrade, selectTradingExchangeSelectedQuote } from '@suite-common/trading';
import { AnimatedText, HStack, Loader, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { ScreenHeader } from '@suite-native/navigation';

import { useDexExchangeTxSimulation } from '../../../hooks/exchange/useDexExchangeTxSimulation';

const HeaderTitle = () => {
    const quote = useSelector(selectTradingExchangeSelectedQuote);

    const { isLoading, isEnabled, error } = useDexExchangeTxSimulation();

    const isCrossChain = isCrossChainTrade(quote?.send, quote?.receive);

    if (!isEnabled || error || isCrossChain) {
        return (
            <Text variant="body-md-strong">
                <Translation id="moduleTrading.tradingExchangePreviewScreen.title" />
            </Text>
        );
    }

    return (
        <VStack spacing={0} alignItems="center">
            <Text variant="body-md-strong">
                <Translation id="moduleTrading.tradingExchangePreviewScreen.title" />
            </Text>

            {isLoading ? (
                <HStack spacing="sp4">
                    <Loader size="small" />
                    <Text variant="body-sm">
                        <Translation id="moduleTrading.transactionSimulation.simulating" />
                    </Text>
                </HStack>
            ) : (
                <AnimatedText variant="body-sm" entering={FadeIn}>
                    <Translation id="moduleTrading.transactionSimulation.title" />
                </AnimatedText>
            )}
        </VStack>
    );
};

export const ExchangePreviewScreenHeader = memo(() => (
    <ScreenHeader customContent={<HeaderTitle />} closeActionType="close" />
));
