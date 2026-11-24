import { FadeIn } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { isCrossChainTrade, selectTradingExchangeSelectedQuote } from '@suite-common/trading';
import { AnimatedText, HStack, Loader, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { useDexExchangeTxSimulation } from '../../../hooks/exchange/useDexExchangeTxSimulation';

export const ExchangePreviewSimulationInfo = () => {
    const quote = useSelector(selectTradingExchangeSelectedQuote);

    const { isLoading, isEnabled, error } = useDexExchangeTxSimulation();

    const isCrossChain = isCrossChainTrade(quote?.send, quote?.receive);

    if (!isEnabled || error || isCrossChain) {
        return null;
    }

    if (isLoading) {
        return (
            <HStack spacing="sp4">
                <Loader size="small" />
                <Text variant="body-sm">
                    <Translation id="moduleTrading.transactionSimulation.simulating" />
                </Text>
            </HStack>
        );
    }

    return (
        <AnimatedText variant="body-sm" entering={FadeIn}>
            <Translation id="moduleTrading.transactionSimulation.title" />
        </AnimatedText>
    );
};
