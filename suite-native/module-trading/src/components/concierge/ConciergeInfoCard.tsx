import { Card, IconList, IconListTitledItem, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const ConciergeInfoCard = () => (
    <Card>
        <VStack spacing="sp20">
            <VStack spacing="sp8">
                <Text variant="headline-sm">
                    <Translation id="moduleTrading.tradingScreen.concierge.infoCard.title" />
                </Text>
                <Text variant="body-sm" color="contentSecondary">
                    <Translation id="moduleTrading.tradingScreen.concierge.infoCard.description" />
                </Text>
            </VStack>
            <IconList iconIntent="brand" verticalAlign="flex-start">
                <IconListTitledItem
                    icon="money"
                    title={
                        <Translation id="moduleTrading.tradingScreen.concierge.infoCard.items.pricing.title" />
                    }
                >
                    <Translation id="moduleTrading.tradingScreen.concierge.infoCard.items.pricing.description" />
                </IconListTitledItem>
                <IconListTitledItem
                    icon="user"
                    title={
                        <Translation id="moduleTrading.tradingScreen.concierge.infoCard.items.specialist.title" />
                    }
                >
                    <Translation id="moduleTrading.tradingScreen.concierge.infoCard.items.specialist.description" />
                </IconListTitledItem>
                <IconListTitledItem
                    icon="arrowFatLinesRight"
                    title={
                        <Translation id="moduleTrading.tradingScreen.concierge.infoCard.items.execution.title" />
                    }
                >
                    <Translation id="moduleTrading.tradingScreen.concierge.infoCard.items.execution.description" />
                </IconListTitledItem>
            </IconList>
        </VStack>
    </Card>
);
