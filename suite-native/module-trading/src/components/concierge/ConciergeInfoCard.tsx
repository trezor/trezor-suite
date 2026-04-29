import { Card, IconListItem, Text, VStack } from '@suite-native/atoms';
import { type IconName } from '@suite-native/icons';
import { Translation, type TxKeyPath } from '@suite-native/intl';

type InfoItemProps = {
    icon: IconName;
    titleId: TxKeyPath;
    descriptionId: TxKeyPath;
};

const InfoItem = ({ icon, titleId, descriptionId }: InfoItemProps) => (
    <IconListItem icon={icon} variant="brand" iconSize="large" verticalAlign="flex-start">
        <VStack spacing="sp4">
            <Text variant="body-sm-strong">
                <Translation id={titleId} />
            </Text>
            <Text variant="body-sm" color="contentSecondary">
                <Translation id={descriptionId} />
            </Text>
        </VStack>
    </IconListItem>
);

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

            <VStack spacing="sp20">
                <InfoItem
                    icon="money"
                    titleId="moduleTrading.tradingScreen.concierge.infoCard.items.pricing.title"
                    descriptionId="moduleTrading.tradingScreen.concierge.infoCard.items.pricing.description"
                />
                <InfoItem
                    icon="user"
                    titleId="moduleTrading.tradingScreen.concierge.infoCard.items.specialist.title"
                    descriptionId="moduleTrading.tradingScreen.concierge.infoCard.items.specialist.description"
                />
                <InfoItem
                    icon="arrowFatLinesRight"
                    titleId="moduleTrading.tradingScreen.concierge.infoCard.items.execution.title"
                    descriptionId="moduleTrading.tradingScreen.concierge.infoCard.items.execution.description"
                />
            </VStack>
        </VStack>
    </Card>
);
