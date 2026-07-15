import { memo } from 'react';

import { HStack, Loader, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { ScreenHeader } from '@suite-native/navigation';

import { useDexExchangeTxSimulation } from '../../../hooks/exchange/useDexExchangeTxSimulation';

const HeaderTitle = () => {
    const { isLoading, isEnabled } = useDexExchangeTxSimulation();

    if (!isEnabled) {
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
            <HStack spacing="sp4">
                {isLoading && <Loader size="small" />}
                <Text variant="body-sm">
                    {isLoading ? (
                        <Translation id="moduleTrading.transactionSimulation.simulating" />
                    ) : (
                        <Translation id="moduleTrading.transactionSimulation.title" />
                    )}
                </Text>
            </HStack>
        </VStack>
    );
};

export const ExchangePreviewScreenHeader = memo(() => (
    <ScreenHeader customContent={<HeaderTitle />} closeActionType="close" />
));
